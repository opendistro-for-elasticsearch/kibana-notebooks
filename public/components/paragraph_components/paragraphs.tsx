/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React, { useState, Fragment, forwardRef, useRef, useImperativeHandle } from 'react';
import moment from 'moment';
import { Cell } from '@nteract/presentational-components';
import {
  EuiButtonEmpty,
  EuiForm,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiHorizontalRule,
  EuiButtonIcon,
  EuiSpacer,
  EuiPopover,
  EuiContextMenu,
  EuiButton,
  EuiContextMenuPanelDescriptor,
  EuiIcon,
  EuiComboBox,
} from '@elastic/eui';
import { htmlIdGenerator } from '@elastic/eui/lib/services';
import _ from 'lodash';

import {
  DashboardStart,
  DashboardContainerInput,
} from '../../../../../src/plugins/dashboard/public';
import { ViewMode } from '../../../../../src/plugins/embeddable/public';
import { CoreStart } from '../../../../../src/core/public';

import { ParaOutput } from './para_output';
import { ParaInput } from './para_input';
import { API_PREFIX, ParaType, DATE_FORMAT } from '../../../common';

/*
 * "Paragraphs" component is used to render cells of the notebook open and "add para div" between paragraphs
 *
 * Props taken in as params are:
 * para - parsed paragraph from notebook
 * dateModified - last modified time of paragraph
 * index - index of paragraph in the notebook
 * paragraphSelector - function used to select a para on click
 * textValueEditor - function for handling input in textarea
 * handleKeyPress - function for handling key press like "Shift-key+Enter" to run paragraph
 * addPara - function to add a new para onclick - "Add Para" Div
 * DashboardContainerByValueRenderer - Dashboard container renderer for visualization
 * deleteVizualization - function to delete a para
 * http object - for making API requests
 * selectedViewId - selected view: view_both, input_only, output_only
 * deletePara - function to delete the selected para
 * runPara - function to run the selected para
 * clonePara - function to clone the selected para
 * clearPara - function to clear output of all the paras
 * movePara - function to move a paragraph at an index to another index
 *
 * Cell component of nteract used as a container for paragraphs in notebook UI.
 * https://components.nteract.io/#cell
 */
type ParagraphProps = {
  para: ParaType;
  dateModified: string;
  index: number;
  showInput: boolean;
  setShowInput: (shouldShowInput: boolean) => void;
  paraCount: number;
  paragraphSelector: (index: number) => void;
  textValueEditor: (evt: React.ChangeEvent<HTMLTextAreaElement>, index: number) => void;
  handleKeyPress: (evt: React.KeyboardEvent<Element>, para: ParaType, index: number) => void;
  addPara: (index: number, newParaContent: string, inputType: string) => void;
  DashboardContainerByValueRenderer: DashboardStart['DashboardContainerByValueRenderer'];
  deleteVizualization: (uniqueId: string) => void;
  vizualizationEditor: (vizContent: string, index: number) => void;
  http: CoreStart['http'];
  selectedViewId: string;
  deletePara: (para: ParaType, index: number) => void;
  runPara: (para: ParaType, index: number) => void;
  clonePara: (para: ParaType, index: number) => void;
  movePara: (index: number, targetIndex: number) => void;
};

export const Paragraphs = forwardRef((props: ParagraphProps, ref) => {
  const {
    para,
    index,
    showInput,
    setShowInput,
    paragraphSelector,
    textValueEditor,
    handleKeyPress,
    addPara,
    DashboardContainerByValueRenderer,
    deleteVizualization,
    vizualizationEditor,
    http,
  } = props;

  const outputExists = para?.out[0] !== '' || para?.vizObjectInput !== '';
  const loadedVizObject: DashboardContainerInput = para?.isVizualisation ? JSON.parse(para.vizObjectInput) : {};
  loadedVizObject.viewMode = ViewMode.VIEW;

  const [isModalVisible, setIsModalVisible] = useState(false); // Boolean for showing visualization modal
  const [options, setOptions] = useState([]); // options for loading saved visualizations
  const [currentPara, setCurrentPara] = useState(0); // set current paragraph
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [runParaError, setRunParaError] = useState(false);
  const [selectedVisOption, setSelectedVisOption] = useState([]);
  const [visInput, setVisInput] = useState(loadedVizObject);
  const [startTime, setStartTime] = useState(loadedVizObject?.timeRange?.from);
  const [endTime, setEndTime] = useState(loadedVizObject?.timeRange?.to);
  const [toggleVisEdit, setToggleVisEdit] = useState(false);

  useImperativeHandle(ref, () => ({
    showAddVisualizationModal(index: number) {
      showModal(index);
    }
  }));

  const createNewVizObject = (objectId: string) => {
    const vizUniqueId = htmlIdGenerator()();

    // a dashboard container object for new visualization
    const newVizObject: DashboardContainerInput = {
      viewMode: ViewMode.VIEW,
      panels: {
        '1': {
          gridData: {
            x: 15,
            y: 0,
            w: 20,
            h: 20,
            i: '1',
          },
          type: 'visualization',
          explicitInput: {
            id: '1',
            savedObjectId: objectId,
          },
        },
      },
      isFullScreenMode: false,
      filters: [],
      useMargins: false,
      id: vizUniqueId,
      timeRange: {
        to: moment(),
        from: moment().subtract(30, 'd'),
      },
      title: 'embed_viz_' + vizUniqueId,
      query: {
        query: '',
        language: 'lucene',
      },
      refreshConfig: {
        pause: true,
        value: 15,
      },
    };
    return newVizObject;
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedVisOption([]);
  };

  // Function to add visualization to the notebook
  const onSelectViz = () => {
    const newVizObject = createNewVizObject(selectedVisOption[0].key);
    closeModal();
    addPara(currentPara, JSON.stringify(newVizObject), 'VISUALIZATION');
  };

  const onRunPara = () => {
    if (para.isVizualisation) {
      let inputTemp = _.cloneDeep(visInput);
      const newTimeRange = {
        from: startTime,
        to: endTime,
      };
      inputTemp.timeRange = newTimeRange;
      setVisInput(inputTemp);
      vizualizationEditor(JSON.stringify(inputTemp), para.id - 1);
      setShowInput(false);
      return;
    }

    if (!para.inp) {
      setRunParaError(true);
      return;
    }
    setRunParaError(false);
    props.runPara(para, index);
    setShowInput(false);
  };

  // Shows modal with all saved visualizations for the users
  const showModal = async (index: number) => {
    setCurrentPara(index);
    http
      .get(`${API_PREFIX}/visualizations`)
      .then((res) => {
        const opt = res.savedVisualizations.map((vizObject) => ({
          label: vizObject.label,
          key: vizObject.key,
        }));
        setOptions(opt);
        setIsModalVisible(true);
      })
      .catch((err) => console.error('Fetching visualization issue', err.body.message));
  };

  // Modal layout if a user wants add Visualizations
  const modalLayout = (
    <EuiOverlayMask>
      <EuiModal onClose={closeModal}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>Select a Kibana visualization</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiForm>
            <Fragment>
              <EuiComboBox
                placeholder="Find Kibana visualization"
                singleSelection={{ asPlainText: true }}
                options={options}
                selectedOptions={selectedVisOption}
                onChange={(newOptions) => setSelectedVisOption(newOptions)}
              />
            </Fragment>
          </EuiForm>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={closeModal}>Cancel</EuiButtonEmpty>
          <EuiButton onClick={() => onSelectViz()} fill>Select</EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );

  const renderParaHeader = (type: string, index: number) => {
    const panels: EuiContextMenuPanelDescriptor[] = [
      {
        id: 0,
        title: 'Paragraph actions',
        items: [
          {
            name: 'Run input',
            onClick: () => {
              setIsPopoverOpen(false);
              onRunPara();
            },
          },
          {
            name: 'Move up',
            disabled: index === 0,
            onClick: () => {
              setIsPopoverOpen(false);
              props.movePara(index, index - 1);
            },
          },
          {
            name: 'Move to top',
            disabled: index === 0,
            onClick: () => {
              setIsPopoverOpen(false);
              props.movePara(index, 0);
            },
          },
          {
            name: 'Move down',
            disabled: index === props.paraCount - 1,
            onClick: () => {
              setIsPopoverOpen(false);
              props.movePara(index, index + 1);
            },
          },
          {
            name: 'Move to bottom',
            disabled: index === props.paraCount - 1,
            onClick: () => {
              setIsPopoverOpen(false);
              props.movePara(index, props.paraCount - 1);
            },
          },
          {
            name: 'Duplicate',
            onClick: () => {
              setIsPopoverOpen(false);
              props.clonePara(para, index + 1);
            },
          },
          {
            name: 'Insert paragraph above',
            panel: 1,
          },
          {
            name: 'Insert paragraph below',
            panel: 2,
          },
          {
            name: 'Delete',
            onClick: () => {
              setIsPopoverOpen(false);
              props.deletePara(para, index);
            },
          },
        ]
      },
      {
        id: 1,
        title: 'Insert paragraph above',
        items: [
          {
            name: 'Markdown',
            onClick: () => {
              setIsPopoverOpen(false);
              props.addPara(para.id - 1, '', 'CODE');
            },
          },
          {
            name: 'Visualization',
            onClick: () => {
              setIsPopoverOpen(false);
              showModal(para.id - 1);
            },
          },
        ],
      },
      {
        id: 2,
        title: 'Insert paragraph below',
        items: [
          {
            name: 'Markdown',
            onClick: () => {
              setIsPopoverOpen(false);
              props.addPara(para.id, '', 'CODE');
            },
          },
          {
            name: 'Visualization',
            onClick: () => {
              setIsPopoverOpen(false);
              showModal(para.id);
            },
          },
        ],
      },
    ];

    return (
      <>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText color="subdued">
              {`[${index + 1}] ${type} `}
              <EuiButtonIcon
                aria-label="Toggle show input"
                iconType={showInput ? "arrowUp" : "arrowDown"}
                onClick={() => setShowInput(!showInput)}
              />
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiPopover
              panelPaddingSize="none"
              withTitle
              button={(<EuiButtonIcon
                aria-label="Open paragraph menu"
                iconType="boxesHorizontal"
                onClick={() => setIsPopoverOpen(true)}
              />)}
              isOpen={isPopoverOpen}
              closePopover={() => setIsPopoverOpen(false)}>
              <EuiContextMenu initialPanelId={0} panels={panels} />
            </EuiPopover>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='s' />
      </>
    );
  };

  // show default paragraph if no paragraphs in this notebook
  if (props.para === undefined) {
    return (
      <>
        <EuiPanel>
          <EuiSpacer size='xxl' />
          <EuiText textAlign='center'>
            <h2>No paragraph</h2>
            <EuiText>
              Add paragraph to compose your document or story. Notebook now supports two types of input:
          </EuiText>
          </EuiText>
          <EuiSpacer size='xl' />
          <EuiFlexGroup justifyContent='spaceAround'>
            <EuiFlexItem grow={false}>
              <EuiText textAlign='center'>
                <EuiIcon size="xxl" type="editorCodeBlock" />
                <h3>Markdown</h3>
                <p>Create rich text with markup language.</p>
              </EuiText>
              <EuiButton onClick={() => props.addPara(0, '', 'CODE')}>
                Add markdown paragraph
            </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText textAlign='center'>
                <EuiIcon size="xxl" type="visArea" />
                <h3>Kibana visualization</h3>
                <p>Import Kibana visualizations to the notes</p>
              </EuiText>
              <EuiButton onClick={() => showModal(0)}>
                Add Kibana visualization paragraph
            </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size='xxl' />
        </EuiPanel>
        {isModalVisible && modalLayout}
      </>
    );
  }

  // do not show input and EuiPanel if view mode is output_only
  if (props.selectedViewId === 'output_only') {
    return <ParaOutput
      para={para}
      visInput={visInput}
      setVisInput={setVisInput}
      DashboardContainerByValueRenderer={DashboardContainerByValueRenderer}
    />;
  }

  return (
    <>
      <EuiPanel>
        {renderParaHeader(para.isVizualisation ? 'Kibana visualization' : 'Markdown', index)}
        <Cell
          key={index}
          onClick={() => paragraphSelector(index)}
        >
          {showInput &&
            <>
              <ParaInput
                para={para}
                index={index}
                runParaError={runParaError}
                textValueEditor={textValueEditor}
                handleKeyPress={handleKeyPress}
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
              />
              {runParaError &&
                <EuiText color="danger" size="s" style={{ marginLeft: 16 }}>Input is required.</EuiText>
              }
              <EuiSpacer size='m' />
              <EuiFlexGroup alignItems='center' style={{ marginLeft: 4 }}>
                <EuiFlexItem grow={false}>
                  <EuiButton onClick={() => onRunPara()}>
                    {outputExists ? 'Refresh' : 'Run'}
                  </EuiButton>
                </EuiFlexItem>
                {outputExists && !para.isVizualisation &&
                  <EuiFlexItem>
                    <EuiText color='subdued'>
                      {`Output available from ${moment(props.dateModified).format(DATE_FORMAT)}`}
                    </EuiText>
                  </EuiFlexItem>
                }
              </EuiFlexGroup>
              <EuiSpacer size='m' />
            </>
          }
          {props.selectedViewId !== 'input_only' && outputExists &&
            <>
              <EuiHorizontalRule margin='none' />
              <ParaOutput
                para={para}
                visInput={visInput}
                setVisInput={setVisInput}
                DashboardContainerByValueRenderer={DashboardContainerByValueRenderer}
              />
            </>
          }
        </Cell>
      </EuiPanel>

      {isModalVisible && modalLayout}
    </>
  );
});

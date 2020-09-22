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

import React, { Component, RefObject } from 'react';
import {
  EuiTitle,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiButtonGroup,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiPopover,
  EuiContextMenu,
  EuiOverlayMask,
  EuiContextMenuPanelDescriptor,
  EuiButtonGroupOption,
} from '@elastic/eui';
import { Cells } from '@nteract/presentational-components';

import { CoreStart, ChromeBreadcrumb } from '../../../../src/core/public';
import { DashboardStart } from '../../../../src/plugins/dashboard/public';

import { Paragraphs } from './paragraph_components/paragraphs';
import { SELECTED_BACKEND, DATE_FORMAT } from '../../common';
import { API_PREFIX, ParaType } from '../../common';
import { zeppelinParagraphParser } from './helpers/zeppelin_parser';
import { defaultParagraphParser } from './helpers/default_parser';
import moment from 'moment';
import { PanelWrapper } from './helpers/panel_wrapper';
import { getDeleteModal, getCustomModal, DeleteNotebookModal } from './helpers/modal_containers';

/*
 * "Notebook" component is used to display an open notebook
 *
 * Props taken in as params are:
 * basename - base url for kibana notebooks
 * DashboardContainerByValueRenderer - Dashboard container renderer for visualization
 * http object - for making API requests
 * setBreadcrumbs - sets breadcrumbs on top
 */
type NotebookProps = {
  basename: string;
  openedNoteId: string;
  DashboardContainerByValueRenderer: DashboardStart['DashboardContainerByValueRenderer'];
  http: CoreStart['http'];
  setBreadcrumbs: (newBreadcrumbs: ChromeBreadcrumb[]) => void;
  renameNotebook: (newNoteName: string, noteId: string) => void;
  deleteNotebook: (noteId: string, noteName?: string, showToast?: boolean) => void;
  setToast: (title: string, color?: string, text?: string) => void;
};

type NotebookState = {
  selectedViewId: string;
  path: string;
  dateCreated: string;
  dateModified: string;
  paragraphs: any; // notebook paragraphs fetched from API
  parsedPara: Array<ParaType>; // paragraphs parsed to a common format
  paraRefs: Array<RefObject<HTMLDivElement>>; // paragraph refs for auto scrolling after moved
  paraInputExpanded: boolean[]; // input is expanded or collapsed per paragraph
  paraOutputStale: boolean[]; // whether output of a paragraph reflects latest input
  toggleOutput: boolean; // Hide Outputs toggle
  toggleInput: boolean; // Hide Inputs toggle
  vizPrefix: string; // prefix for visualizations in Zeppelin Adaptor
  isAddParaPopoverOpen: boolean;
  isParaActionsPopoverOpen: boolean;
  isNoteActionsPopoverOpen: boolean;
  isModalVisible: boolean;
  modalLayout: React.ReactNode;
};
export class Notebook extends Component<NotebookProps, NotebookState> {
  child: React.RefObject<any>;
  constructor(props: Readonly<NotebookProps>) {
    super(props);
    this.state = {
      selectedViewId: 'view_both',
      path: '',
      dateCreated: '',
      dateModified: '',
      paragraphs: [],
      parsedPara: [],
      paraRefs: [],
      paraInputExpanded: [],
      paraOutputStale: [],
      toggleOutput: true,
      toggleInput: true,
      vizPrefix: '',
      isAddParaPopoverOpen: false,
      isParaActionsPopoverOpen: false,
      isNoteActionsPopoverOpen: false,
      isModalVisible: false,
      modalLayout: <EuiOverlayMask></EuiOverlayMask>,
    };
    this.child = React.createRef();
  }

  parseAllParagraphs = () => {
    let parsedPara = this.parseParagraphs(this.state.paragraphs);
    // set default state for displaying input and output stale
    if (this.state.paraInputExpanded.length === 0)
      this.setState({ paraInputExpanded: parsedPara.map(() => this.state.selectedViewId === 'input_only') });
    if (this.state.paraOutputStale.length === 0)
      this.setState({ paraOutputStale: parsedPara.map(() => false) });
    this.setState({ parsedPara, paraRefs: parsedPara.map(() => React.createRef()) });
  };

  // parse paragraphs based on backend
  parseParagraphs = (paragraphs: any[]) => {
    try {
      let parsedPara;
      if (SELECTED_BACKEND === 'ZEPPELIN') {
        parsedPara = zeppelinParagraphParser(paragraphs);
        this.setState({ vizPrefix: '%sh #vizobject:' });
      } else {
        parsedPara = defaultParagraphParser(paragraphs);
      }
      return parsedPara;
    } catch (error) {
      console.error('Parsing paragraph has some issue', error);
      this.setState({ parsedPara: [], paraRefs: [], paraOutputStale: [] });
    }
  };

  // Assigns Loading, Running & inQueue for paragraphs in current notebook
  showParagraphRunning = (param: number | string) => {
    let parsedPara = this.state.parsedPara;
    this.state.parsedPara.map((_: ParaType, index: number) => {
      if (param === 'queue') {
        parsedPara[index].inQueue = true;
        parsedPara[index].isOutputHidden = true;
      } else if (param === 'loading') {
        parsedPara[index].isRunning = true;
        parsedPara[index].isOutputHidden = true;
      } else if (param === index) {
        parsedPara[index].isRunning = true;
        parsedPara[index].isOutputHidden = true;
      }
    });
    this.setState({ parsedPara });
  };

  // Sets a paragraph to selected and deselects all others
  paragraphSelector = (index: number) => {
    let parsedPara = this.state.parsedPara;
    this.state.parsedPara.map((_: ParaType, idx: number) => {
      if (index === idx) parsedPara[idx].isSelected = true;
      else parsedPara[idx].isSelected = false;
    });
    this.setState({ parsedPara });
  };

  // Function for delete a Notebook button
  deleteParagraphButton = (para: ParaType, index: number) => {
    if (index !== -1) {
      return this.props.http
        .delete(`${API_PREFIX}/paragraph/` + this.props.openedNoteId + '/' + para.uniqueId)
        .then((res) => {
          const paragraphs = [...this.state.paragraphs];
          paragraphs.splice(index, 1);
          const parsedPara = [...this.state.parsedPara];
          parsedPara.splice(index, 1);
          const paraInputExpanded = [...this.state.paraInputExpanded];
          paraInputExpanded.splice(index, 1);
          const paraOutputStale = [...this.state.paraOutputStale];
          paraOutputStale.splice(index, 1);
          this.setState({ paragraphs, parsedPara, paraInputExpanded, paraOutputStale });
        })
        .catch((err) => console.error('Delete paragraph issue: ', err.body.message));
    }
  };

  showDeleteParaModal = (para: ParaType, index: number) => {
    this.setState({
      modalLayout: getDeleteModal(
        () => this.setState({ isModalVisible: false }),
        () => {
          this.deleteParagraphButton(para, index);
          this.setState({ isModalVisible: false });
        },
        'Delete paragraph',
        'Are you sure you want to delete the paragraph? The action cannot be undone.')
    });
    this.setState({ isModalVisible: true });
  };

  showDeleteAllParaModal = () => {
    this.setState({
      modalLayout: getDeleteModal(
        () => this.setState({ isModalVisible: false }),
        async () => {
          this.setState({ isModalVisible: false });
          await this.runForAllParagraphs((para: ParaType, index: number) => {
            return this.props.http
              .delete(`${API_PREFIX}/paragraph/${this.props.openedNoteId}/${para.uniqueId}`)
              .then((res) => {
                this.setState({ paragraphs: res.paragraphs });
                this.parseAllParagraphs();
              })
              .catch((err) => console.error('Delete paragraph issue: ', err.body.message));
          });
          this.props.setToast('Paragraphs successfully deleted!');
        },
        'Delete all paragraphs',
        'Are you sure you want to delete all paragraphs? The action cannot be undone.')
    });
    this.setState({ isModalVisible: true });
  };

  showClearOutputsModal = () => {
    this.setState({
      modalLayout: getDeleteModal(
        () => this.setState({ isModalVisible: false }),
        () => {
          this.clearParagraphButton();
          this.setState({ isModalVisible: false });
        },
        'Clear all outputs',
        'Are you sure you want to clear all outputs? The action cannot be undone.',
        'Yes, clear')
    });
    this.setState({ isModalVisible: true });
  };

  showRenameModal = () => {
    this.setState({
      modalLayout: getCustomModal(
        (newName: string) => {
          this.props.renameNotebook(newName, this.props.openedNoteId);
          this.setState({ isModalVisible: false });
          this.loadNotebook();
        },
        () => this.setState({ isModalVisible: false }),
        'Edit notebook name',
        'Please edit name',
        'Cancel',
        'Rename',
        this.state.path,
        'Enter a unique name to describe the purpose of this notebook. The name must be less than 50 characters.')
    });
    this.setState({ isModalVisible: true });
  }

  showDeleteNotebookModal = () => {
    this.setState({
      modalLayout: (
        <DeleteNotebookModal
          onConfirm={() => {
            this.props.deleteNotebook(this.props.openedNoteId, this.state.path);
            this.setState({ isModalVisible: false });
            window.location.replace(`${this.props.basename}#`);
          }}
          onCancel={() => this.setState({ isModalVisible: false })}
          title={`Delete notebook "${this.state.path}"`}
          message="Delete notebook will remove all contents in the paragraphs."
        />
      )
    });
    this.setState({ isModalVisible: true });
  }

  // Function for delete Visualization from notebook
  deleteVizualization = (uniqueId: string) => {
    this.props.http
      .delete(`${API_PREFIX}/paragraph/` + this.props.openedNoteId + '/' + uniqueId)
      .then((res) => {
        this.setState({ paragraphs: res.paragraphs });
        this.parseAllParagraphs();
      })
      .catch((err) => console.error('Delete vizualization issue: ', err.body.message));
  };

  // Backend call to add a paragraph
  addPara = (index: number, newParaContent: string, inpType: string) => {
    const addParaObj = {
      noteId: this.props.openedNoteId,
      paragraphIndex: index,
      paragraphInput: newParaContent,
      inputType: inpType,
    };

    return this.props.http
      .post(`${API_PREFIX}/paragraph/`, {
        body: JSON.stringify(addParaObj),
      })
      .then((res) => {
        const paragraphs = [...this.state.paragraphs];
        paragraphs.splice(index, 0, res);
        const parsedPara = [...this.state.parsedPara];
        parsedPara.splice(index, 0, this.parseParagraphs([res])[0]);
        const paraInputExpanded = [...this.state.paraInputExpanded];
        paraInputExpanded.splice(index, 0, true);
        const paraOutputStale = [...this.state.paraOutputStale];
        paraOutputStale.splice(index, 0, false);
        const paraRefs = [...this.state.paraRefs];
        paraRefs.splice(index, 0, React.createRef());

        this.setState({ paragraphs, parsedPara, paraInputExpanded, paraOutputStale, paraRefs });
        this.paragraphSelector(index);
      })
      .catch((err) => console.error('Add paragraph issue: ', err.body.message));
  };

  // Function to clone a paragraph
  cloneParaButton = (para: ParaType, index: number) => {
    let inputType = 'CODE';
    if (para.isVizualisation === true) {
      inputType = 'VISUALIZATION';
    }
    if (index !== -1) {
      return this.addPara(index, para.inp, inputType);
    }
  };

  // Function to move a paragraph
  movePara = (index: number, targetIndex: number) => {
    const paragraphs = [...this.state.paragraphs];
    paragraphs.splice(targetIndex, 0, paragraphs.splice(index, 1)[0]);
    const parsedPara = [...this.state.parsedPara];
    parsedPara.splice(targetIndex, 0, parsedPara.splice(index, 1)[0]);
    const paraInputExpanded = [...this.state.paraInputExpanded];
    paraInputExpanded.splice(targetIndex, 0, paraInputExpanded.splice(index, 1)[0]);
    const paraOutputStale = [...this.state.paraOutputStale];
    paraOutputStale.splice(targetIndex, 0, paraOutputStale.splice(index, 1)[0]);

    const moveParaObj = {
      noteId: this.props.openedNoteId,
      paragraphs,
    };

    return this.props.http
      .post(`${API_PREFIX}/set_paragraphs/`, {
        body: JSON.stringify(moveParaObj),
      })
      .then((res) => this.setState({ paragraphs, parsedPara, paraInputExpanded, paraOutputStale }))
      .then((res) => this.scrollToPara(targetIndex))
      .catch((err) => console.error('Move paragraph issue: ', err.body.message));
  };

  scrollToPara(index: number) {
    setTimeout(() => {
      window.scrollTo({
        left: 0,
        top: this.state.paraRefs[index].current.offsetTop,
        behavior: 'smooth'
      })
    }, 0);
  }

  // Function for clearing outputs button
  clearParagraphButton = () => {
    this.showParagraphRunning('loading');
    const clearParaObj = {
      noteId: this.props.openedNoteId,
    };
    this.props.http
      .put(`${API_PREFIX}/paragraph/clearall/`, {
        body: JSON.stringify(clearParaObj),
      })
      .then((res) => {
        this.setState({ paragraphs: res.paragraphs });
        this.parseAllParagraphs();
      })
      .catch((err) => console.error('clear paragraph issue: ', err.body.message));
  };

  // Backend call to update and run contents of paragraph
  updateRunParagraph = (para: ParaType, index: number) => {
    this.showParagraphRunning(index);

    const paraUpdateObject = {
      noteId: this.props.openedNoteId,
      paragraphId: para.uniqueId,
      paragraphInput: para.inp,
    };

    return this.props.http
      .post(`${API_PREFIX}/paragraph/update/run/`, {
        body: JSON.stringify(paraUpdateObject),
      })
      .then((res) => {
        const paragraphs = this.state.paragraphs;
        paragraphs[index] = res;
        const parsedPara = [...this.state.parsedPara];
        parsedPara[index] = this.parseParagraphs([res])[0];
        const paraOutputStale = [...this.state.paraOutputStale];
        paraOutputStale[index] = false;
        this.setState({ paragraphs, parsedPara, paraOutputStale });
      })
      .catch((err) => console.error('run paragraph issue: ', err.body.message));
  };

  runForAllParagraphs = (reducer: (para: ParaType, index: number) => Promise<any>) => {
    return this.state.parsedPara.map((para: ParaType, index: number) => () => reducer(para, index))
      .reduce((chain, func) => chain.then(func), Promise.resolve());
  };

  setParaOutputStale = (index: number, isStale = true) => {
    const paraOutputStale = [...this.state.paraOutputStale];
    paraOutputStale[index] = isStale;
    this.setState({ paraOutputStale });
  }

  // Hanldes Edits in visualization and syncs with paragraph input
  vizualizationEditor = (vizContent: string, index: number) => {
    let parsedPara = this.state.parsedPara;
    parsedPara[index].inp = this.state.vizPrefix + vizContent; // "%sh check"
    this.setParaOutputStale(index, false);
    this.setState({ parsedPara });
  };

  // Handles text editor value and syncs with paragraph input
  textValueEditor = (evt: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    if (!(evt.key === 'Enter' && evt.shiftKey)) {
      let parsedPara = this.state.parsedPara;
      parsedPara[index].inp = evt.target.value;
      if (!this.state.paraOutputStale[index])
        this.setParaOutputStale(index);
      this.setState({ parsedPara });
    }
  };

  // Handles run paragraph shortcut "Shift+Enter"
  handleKeyPress = (evt: React.KeyboardEvent<Element>, para: ParaType, index: number) => {
    if (evt.key === 'Enter' && evt.shiftKey) {
      this.updateRunParagraph(para, index);
    }
  };

  // update view mode, scrolls to paragraph and expands input if scrollToIndex is given
  updateView = (viewId: string, scrollToIndex?: number) => {
    this.setState({ selectedViewId: viewId });
    let hideInput = false, hideOutput = false;
    if (viewId === 'input_only')
      hideOutput = true;
    else if (viewId === 'output_only')
      hideInput = true;

    let parsedPara = [...this.state.parsedPara];
    this.state.parsedPara.map((para: ParaType, index: number) => {
      parsedPara[index].isInputHidden = hideInput;
      parsedPara[index].isOutputHidden = hideOutput;
    });
    this.setState({ parsedPara });

    const paraInputExpanded = parsedPara.map(() => viewId === 'input_only');
    if (scrollToIndex !== undefined) {
      paraInputExpanded[scrollToIndex] = true;
      this.scrollToPara(scrollToIndex);
    }
    this.setState({ paraInputExpanded });
    this.paragraphSelector(scrollToIndex !== undefined ? scrollToIndex : -1);
  };

  loadNotebook = () => {
    this.showParagraphRunning('queue');
    this.props.http
      .get(`${API_PREFIX}/note/` + this.props.openedNoteId)
      .then((res) => {
        this.setBreadcrumbs(res.path);
        this.setState(res, this.parseAllParagraphs);
      })
      .catch((err) => console.error('Fetching notebook issue: ', err.body.message));
    this.setState({ toggleInput: true });
    this.setState({ toggleOutput: true });
  };

  setParaInputExpanded(index: number, inputExpanded: boolean) {
    const paraInputExpanded = [...this.state.paraInputExpanded];
    paraInputExpanded[index] = inputExpanded;
    this.setState({ paraInputExpanded });
  }

  setBreadcrumbs(path: string) {
    this.props.setBreadcrumbs([
      {
        text: 'Notebooks',
        href: '#',
      },
      {
        text: path,
        href: `#${this.props.openedNoteId}`,
      },
    ]);
  }

  componentDidMount() {
    this.loadNotebook();
  }

  render() {
    const viewOptions: EuiButtonGroupOption[] = [
      {
        id: 'view_both',
        label: 'View both',
      },
      {
        id: 'input_only',
        label: 'Input only',
      },
      {
        id: 'output_only',
        label: 'Output only',
      },
    ];
    const addParaPanels: EuiContextMenuPanelDescriptor[] = [
      {
        id: 0,
        title: 'Input type',
        items: [
          {
            name: 'Markdown',
            onClick: () => {
              this.setState({ isAddParaPopoverOpen: false });
              this.addPara(this.state.paragraphs.length, '', 'CODE');
            },
          },
          {
            name: 'Kibana visualization',
            onClick: () => {
              this.setState({ isAddParaPopoverOpen: false });
              this.child.current.showAddVisualizationModal(this.state.paragraphs.length);
            },
          },
        ],
      },
    ];
    const paraActionsPanels: EuiContextMenuPanelDescriptor[] = [
      {
        id: 0,
        title: 'Paragraph actions',
        items: [
          {
            name: 'Add paragraph to top',
            panel: 1,
          },
          {
            name: 'Add paragraph to bottom',
            panel: 2,
          },
          {
            name: 'Run all paragraphs',
            onClick: () => {
              this.setState({ isParaActionsPopoverOpen: false });
              this.runForAllParagraphs(this.updateRunParagraph);
              if (this.state.selectedViewId === 'input_only') {
                this.updateView('view_both');
              }
            },
          },
          {
            name: 'Clear all outputs',
            onClick: () => {
              this.setState({ isParaActionsPopoverOpen: false });
              this.showClearOutputsModal();
            },
          },
          {
            name: 'Delete all paragraphs',
            onClick: () => {
              this.setState({ isParaActionsPopoverOpen: false });
              this.showDeleteAllParaModal();
            },
          },
        ],
      },
      {
        id: 1,
        title: 'Add to top',
        items: [
          {
            name: 'Markdown',
            onClick: () => {
              this.setState({ isParaActionsPopoverOpen: false });
              this.addPara(0, '', 'CODE');
            },
          },
          {
            name: 'Kibana visualization',
            onClick: () => {
              this.setState({ isParaActionsPopoverOpen: false });
              this.child.current.showAddVisualizationModal(0);
            },
          }
        ],
      },
      {
        id: 2,
        title: 'Add to bottom',
        items: [
          {
            name: 'Markdown',
            onClick: () => {
              this.setState({ isParaActionsPopoverOpen: false });
              this.addPara(this.state.paragraphs.length, '', 'CODE');
            },
          },
          {
            name: 'Kibana visualization',
            onClick: () => {
              this.setState({ isParaActionsPopoverOpen: false });
              this.child.current.showAddVisualizationModal(this.state.paragraphs.length);
            },
          }
        ],
      }
    ];
    const noteActionsPanels: EuiContextMenuPanelDescriptor[] = [
      {
        id: 0,
        title: 'Notebook actions',
        items: [
          {
            name: 'Rename notebook',
            onClick: () => {
              this.setState({ isNoteActionsPopoverOpen: false });
              this.showRenameModal();
            },
          },
          {
            name: 'Delete notebook',
            onClick: () => {
              this.setState({ isNoteActionsPopoverOpen: false });
              this.showDeleteNotebookModal();
            },
          },
        ],
      },
    ];

    return (
      <>
        <EuiPage>
          <EuiPageBody component="div">
            <EuiPageHeader>
              <EuiPageHeaderSection>
                <EuiTitle size="l">
                  <h1>{this.state.path}</h1>
                </EuiTitle>
              </EuiPageHeaderSection>
              <EuiPageHeaderSection>
                <EuiFlexGroup gutterSize='s'>
                  <EuiFlexItem>
                    <EuiButtonGroup
                      buttonSize='m'
                      options={viewOptions}
                      idSelected={this.state.selectedViewId}
                      onChange={(id) => {
                        this.updateView(id);
                      }}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem />
                  <EuiFlexItem>
                    <EuiPopover
                      panelPaddingSize="none"
                      withTitle
                      button={
                        <EuiButton
                          iconType='arrowDown'
                          iconSide='right'
                          onClick={() => this.setState({ isParaActionsPopoverOpen: true })}
                        >Paragraph actions</EuiButton>
                      }
                      isOpen={this.state.isParaActionsPopoverOpen}
                      closePopover={() => this.setState({ isParaActionsPopoverOpen: false })}>
                      <EuiContextMenu initialPanelId={0} panels={paraActionsPanels} />
                    </EuiPopover>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiPopover
                      panelPaddingSize="none"
                      withTitle
                      button={
                        <EuiButton
                          iconType='arrowDown'
                          iconSide='right'
                          onClick={() => this.setState({ isNoteActionsPopoverOpen: true })}
                        >Notebook actions</EuiButton>
                      }
                      isOpen={this.state.isNoteActionsPopoverOpen}
                      closePopover={() => this.setState({ isNoteActionsPopoverOpen: false })}>
                      <EuiContextMenu initialPanelId={0} panels={noteActionsPanels} />
                    </EuiPopover>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPageHeaderSection>
            </EuiPageHeader>
            <EuiText color="subdued">Created: {moment(this.state.dateCreated).format(DATE_FORMAT)}</EuiText>
            {this.state.parsedPara.length > 0 ? (
              <>
                <Cells>
                  <PanelWrapper shouldWrap={this.state.selectedViewId === 'output_only'}>
                    {this.state.parsedPara.map((para: ParaType, index: number) => (
                      <div ref={this.state.paraRefs[index]} key={`para_div_${para.uniqueId}`}>
                        <Paragraphs
                          ref={index === 0 && this.child}
                          para={para}
                          dateModified={this.state.paragraphs[index]?.dateModified}
                          index={index}
                          inputExpanded={this.state.paraInputExpanded[index]}
                          setInputExpanded={(inputExpanded: boolean) => this.setParaInputExpanded(index, inputExpanded)}
                          isOutputStale={this.state.paraOutputStale[index]}
                          setIsOutputStale={(isStale: boolean) => this.setParaOutputStale(index, isStale)}
                          paraCount={this.state.parsedPara.length}
                          paragraphSelector={this.paragraphSelector}
                          textValueEditor={this.textValueEditor}
                          handleKeyPress={this.handleKeyPress}
                          addPara={this.addPara}
                          DashboardContainerByValueRenderer={this.props.DashboardContainerByValueRenderer}
                          deleteVizualization={this.deleteVizualization}
                          vizualizationEditor={this.vizualizationEditor}
                          http={this.props.http}
                          selectedViewId={this.state.selectedViewId}
                          setSelectedViewId={this.updateView}
                          deletePara={this.showDeleteParaModal}
                          runPara={this.updateRunParagraph}
                          clonePara={this.cloneParaButton}
                          movePara={this.movePara}
                        />
                      </div>
                    ))}
                  </PanelWrapper>
                </Cells>
                {this.state.selectedViewId !== 'output_only' &&
                  <EuiPopover
                    panelPaddingSize="none"
                    withTitle
                    button={
                      <EuiButton
                        iconType='arrowDown'
                        iconSide='right'
                        onClick={() => this.setState({ isAddParaPopoverOpen: true })}
                      >Add paragraph</EuiButton>
                    }
                    isOpen={this.state.isAddParaPopoverOpen}
                    closePopover={() => this.setState({ isAddParaPopoverOpen: false })}>
                    <EuiContextMenu initialPanelId={0} panels={addParaPanels} />
                  </EuiPopover>
                }
              </>
            ) : (
                // show default paragraph if no paragraphs in this notebook
                <div style={{ marginTop: 20 }}>
                  <Paragraphs
                    ref={this.child}
                    addPara={this.addPara}
                    http={this.props.http}
                  />
                </div>
              )}
          </EuiPageBody>
        </EuiPage>
        {this.state.isModalVisible && this.state.modalLayout}
      </>
    );
  }
}

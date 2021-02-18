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

import React, { Component } from 'react';
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
  EuiIcon,
  EuiPanel,
  EuiCard,
} from '@elastic/eui';
import _ from 'lodash';
import { Cells } from '@nteract/presentational-components';

import { CoreStart, ChromeBreadcrumb } from '../../../../src/core/public';
import { DashboardStart } from '../../../../src/plugins/dashboard/public';

import { Paragraphs } from './paragraph_components/paragraphs';
import { SELECTED_BACKEND, DATE_FORMAT, CREATE_NOTE_MESSAGE } from '../../common';
import { API_PREFIX, ParaType } from '../../common';
import { zeppelinParagraphParser } from './helpers/zeppelin_parser';
import { defaultParagraphParser } from './helpers/default_parser';
import moment from 'moment';
import { PanelWrapper } from './helpers/panel_wrapper';
import { getDeleteModal, getCustomModal, DeleteNotebookModal } from './helpers/modal_containers';
import CSS from 'csstype';

const panelStyles: CSS.Properties = {
  float: 'left',
  width: '100%',
  maxWidth: '1200px',
  marginTop: '20px'
};

const pageStyles: CSS.Properties = {
  float: 'left',
  width: '100%',
  maxWidth: '1570px',
}


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
  cloneNotebook: (newNoteName: string, noteId: string) => Promise<string>;
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
  vizPrefix: string; // prefix for visualizations in Zeppelin Adaptor
  isAddParaPopoverOpen: boolean;
  isParaActionsPopoverOpen: boolean;
  isNoteActionsPopoverOpen: boolean;
  isModalVisible: boolean;
  modalLayout: React.ReactNode;
};
export class Notebook extends Component<NotebookProps, NotebookState> {
  constructor(props: Readonly<NotebookProps>) {
    super(props);
    this.state = {
      selectedViewId: 'view_both',
      path: '',
      dateCreated: '',
      dateModified: '',
      paragraphs: [],
      parsedPara: [],
      vizPrefix: '',
      isAddParaPopoverOpen: false,
      isParaActionsPopoverOpen: false,
      isNoteActionsPopoverOpen: false,
      isModalVisible: false,
      modalLayout: <EuiOverlayMask></EuiOverlayMask>,
    };
  }

  parseAllParagraphs = () => {
    let parsedPara = this.parseParagraphs(this.state.paragraphs);
    this.setState({ parsedPara });
  };

  // parse paragraphs based on backend
  parseParagraphs = (paragraphs: any[]): ParaType[] => {
    try {
      let parsedPara;
      if (SELECTED_BACKEND === 'ZEPPELIN') {
        parsedPara = zeppelinParagraphParser(paragraphs);
        this.setState({ vizPrefix: '%sh #vizobject:' });
      } else {
        parsedPara = defaultParagraphParser(paragraphs);
      }
      parsedPara.forEach((para: ParaType) => {
        para.isInputExpanded = this.state.selectedViewId === 'input_only';
        para.paraRef = React.createRef();
        para.paraDivRef = React.createRef<HTMLDivElement>();
      });
      return parsedPara;
    } catch (err) {
      this.props.setToast('Error parsing paragraphs, please make sure you have the correct permission.', 'danger');
      console.error(err);
      this.setState({ parsedPara: [] });
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
          this.setState({ paragraphs, parsedPara });
        })
      .catch((err) => {
        this.props.setToast('Error deleting paragraph, please make sure you have the correct permission.', 'danger');
        console.error(err.body.message);
      });
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
              .catch((err) => {
                this.props.setToast('Error deleting paragraph, please make sure you have the correct permission.', 'danger');
                console.error(err.body.message);
              });
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
        'Clear')
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
        'Name',
        'Rename notebook',
        'Cancel',
        'Rename',
        this.state.path,
        CREATE_NOTE_MESSAGE)
    });
    this.setState({ isModalVisible: true });
  }

  showCloneModal = () => {
    this.setState({
      modalLayout: getCustomModal(
        (newName: string) => {
          this.props.cloneNotebook(newName, this.props.openedNoteId)
            .then((id: string) => {
              window.location.assign(`${this.props.basename}#${id}`);
              setTimeout(() => {
                this.loadNotebook()
              }, 300);
            });
          this.setState({ isModalVisible: false });
        },
        () => this.setState({ isModalVisible: false }),
        'Name',
        'Duplicate notebook',
        'Cancel',
        'Duplicate',
        this.state.path + ' (copy)',
        CREATE_NOTE_MESSAGE)
    });
    this.setState({ isModalVisible: true });
  }

  showDeleteNotebookModal = () => {
    this.setState({
      modalLayout: (
        <DeleteNotebookModal
          onConfirm={async () => {
            await this.props.deleteNotebook(this.props.openedNoteId, this.state.path);
            this.setState({ isModalVisible: false }, () =>
              setTimeout(() => {
                window.location.replace(`${this.props.basename}#`);
              }, 300)
            );
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
      .catch((err) => {
        this.props.setToast('Error deleting visualization, please make sure you have the correct permission.', 'danger');
        console.error(err.body.message);
      });
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
        const newPara = this.parseParagraphs([res])[0];
        newPara.isInputExpanded = true;
        const parsedPara = [...this.state.parsedPara];
        parsedPara.splice(index, 0, newPara);

        this.setState({ paragraphs, parsedPara });
        this.paragraphSelector(index);
      })
      .catch((err) => {
        this.props.setToast('Error adding paragraph, please make sure you have the correct permission.', 'danger');
        console.error(err.body.message);
      });
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

    const moveParaObj = {
      noteId: this.props.openedNoteId,
      paragraphs,
    };

    return this.props.http
      .post(`${API_PREFIX}/set_paragraphs/`, {
        body: JSON.stringify(moveParaObj),
      })
      .then((res) => this.setState({ paragraphs, parsedPara }))
      .then((res) => this.scrollToPara(targetIndex))
      .catch((err) => {
        this.props.setToast('Error moving paragraphs, please make sure you have the correct permission.', 'danger');
        console.error(err.body.message);
      });
  };

  scrollToPara(index: number) {
    setTimeout(() => {
      window.scrollTo({
        left: 0,
        top: this.state.parsedPara[index].paraDivRef.current.offsetTop,
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
      .catch((err) => {
        this.props.setToast('Error clearing paragraphs, please make sure you have the correct permission.', 'danger');
        console.error(err.body.message);
      });
  };

  // Backend call to update and run contents of paragraph
  updateRunParagraph = (para: ParaType, index: number, vizObjectInput?: string) => {
    this.showParagraphRunning(index);
    if (vizObjectInput) {
      para.inp = this.state.vizPrefix + vizObjectInput; // "%sh check"
    }

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
        this.setState({ paragraphs, parsedPara });
      })
      .catch((err) => {
        this.props.setToast('Error running paragraph, please make sure you have the correct permission.', 'danger');
        console.error(err.body.message);
      });
  };

  runForAllParagraphs = (reducer: (para: ParaType, index: number) => Promise<any>) => {
    return this.state.parsedPara.map((para: ParaType, index: number) => () => reducer(para, index))
      .reduce((chain, func) => chain.then(func), Promise.resolve());
  };

  // Handles text editor value and syncs with paragraph input
  textValueEditor = (evt: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    if (!(evt.key === 'Enter' && evt.shiftKey)) {
      let parsedPara = this.state.parsedPara;
      parsedPara[index].inp = evt.target.value;
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
  updateView = (selectedViewId: string, scrollToIndex?: number) => {
    let parsedPara = [...this.state.parsedPara];
    this.state.parsedPara.map((para: ParaType, index: number) => {
      parsedPara[index].isInputExpanded = selectedViewId === 'input_only';
    });

    if (scrollToIndex !== undefined) {
      parsedPara[scrollToIndex].isInputExpanded = true;
      this.scrollToPara(scrollToIndex);
    }
    this.setState({ parsedPara, selectedViewId });
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
    .catch((err) => {
      this.props.setToast('Error fetching notebooks, please make sure you have the correct permission.', 'danger');
      console.error(err.body.message);
    });
  };

  setPara = (para: ParaType, index: number) => {
    const parsedPara = [...this.state.parsedPara];
    parsedPara.splice(index, 1, para);
    this.setState({ parsedPara });
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
    this.setBreadcrumbs('');
    this.loadNotebook();
  }

  render() {
    const createdText = (
      <div>
        <p>Created <br/> {moment(this.state.dateCreated).format(DATE_FORMAT)}</p>
      </div>
    );
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
        title: 'Type',
        items: [
          {
            name: 'Code block',
            onClick: () => {
              this.setState({ isAddParaPopoverOpen: false });
              this.addPara(this.state.paragraphs.length, '', 'CODE');
            },
          },
          {
            name: 'Kibana visualization',
            onClick: () => {
              this.setState({ isAddParaPopoverOpen: false });
              this.addPara(this.state.paragraphs.length, '', 'VISUALIZATION');
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
            disabled: this.state.parsedPara.length === 0,
            onClick: () => {
              this.setState({ isParaActionsPopoverOpen: false });
              this.runForAllParagraphs((para: ParaType, index: number) => {
                return para.paraRef.current.runParagraph();
              });
              if (this.state.selectedViewId === 'input_only') {
                this.updateView('view_both');
              }
            },
          },
          {
            name: 'Clear all outputs',
            disabled: this.state.parsedPara.length === 0,
            onClick: () => {
              this.setState({ isParaActionsPopoverOpen: false });
              this.showClearOutputsModal();
            },
          },
          {
            name: 'Delete all paragraphs',
            disabled: this.state.parsedPara.length === 0,
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
              this.addPara(0, '', 'VISUALIZATION');
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
              this.addPara(this.state.paragraphs.length, '', 'VISUALIZATION');
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
            name: 'Duplicate notebook',
            onClick: () => {
              this.setState({ isNoteActionsPopoverOpen: false });
              this.showCloneModal();
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
      <div style={pageStyles}>
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
                  {this.state.parsedPara.length > 0 &&
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
                  }
                  <EuiFlexItem />
                  <EuiFlexItem />
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
            <EuiFlexGroup alignItems={'flexStart'} gutterSize={'l'}>
              <EuiFlexItem grow={false}>
                <EuiText>{createdText}</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            {this.state.parsedPara.length > 0 ? (
              <>
                <Cells>
                  <PanelWrapper shouldWrap={this.state.selectedViewId === 'output_only'}>
                    {this.state.parsedPara.map((para: ParaType, index: number) => (
                      <div ref={this.state.parsedPara[index].paraDivRef} key={`para_div_${para.uniqueId}`} style={panelStyles}>
                        <Paragraphs
                          ref={this.state.parsedPara[index].paraRef}
                          para={para}
                          setPara={(para: ParaType) => this.setPara(para, index)}
                          dateModified={this.state.paragraphs[index]?.dateModified}
                          index={index}
                          paraCount={this.state.parsedPara.length}
                          paragraphSelector={this.paragraphSelector}
                          textValueEditor={this.textValueEditor}
                          handleKeyPress={this.handleKeyPress}
                          addPara={this.addPara}
                          DashboardContainerByValueRenderer={this.props.DashboardContainerByValueRenderer}
                          deleteVizualization={this.deleteVizualization}
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
                <div style={panelStyles}>
                  <EuiPanel>
                    <EuiSpacer size='xxl' />
                    <EuiText textAlign='center'>
                      <h2>No paragraphs</h2>
                      <EuiText>
                        Add a paragraph to compose your document or story. Notebooks now support two types of input:
                      </EuiText>
                    </EuiText>
                    <EuiSpacer size='xl' />
                    <EuiFlexGroup justifyContent='spaceEvenly'>
                      <EuiFlexItem grow={2} />
                      <EuiFlexItem grow={3}>
                        <EuiCard
                          icon={<EuiIcon size="xxl" type="editorCodeBlock" />}
                          title="Code block"
                          description="Write contents directly using markdown, SQL or PPL"
                          footer={
                            <EuiButton onClick={() => this.addPara(0, '', 'CODE')} style={{ marginBottom: 17 }}>
                              Add
                            </EuiButton>
                          }
                        />
                      </EuiFlexItem>
                      <EuiFlexItem grow={3}>
                        <EuiCard
                          icon={<EuiIcon size="xxl" type="visArea" />}
                          title="Kibana visualization"
                          description="Import Kibana visualizations to the notes"
                          footer={
                            <EuiButton onClick={() => this.addPara(0, '', 'VISUALIZATION')} style={{ marginBottom: 17 }}>
                              Add Kibana visualization paragraph
                            </EuiButton>
                          }
                        />
                      </EuiFlexItem>
                      <EuiFlexItem grow={2} />
                    </EuiFlexGroup>
                    <EuiSpacer size='xxl' />
                  </EuiPanel>
                </div>
              )}
          </EuiPageBody>
        </EuiPage>
        {this.state.isModalVisible && this.state.modalLayout}
      </div>
    );
  }
}

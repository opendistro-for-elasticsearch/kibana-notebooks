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

import { EuiButton, EuiFieldSearch, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiLink, EuiPageBody, EuiPageContentHeader, EuiPageContentHeaderSection, EuiSpacer, EuiSuperSelect, EuiText, EuiTitle, EuiOverlayMask, EuiPopover, EuiContextMenu, EuiIcon, EuiContextMenuItem, EuiContextMenuPanel, EuiInMemoryTable, EuiTableFieldDataColumnType } from '@elastic/eui'
import React, { useState, useRef } from 'react'
import { getCustomModal, getCloneModal, getDeleteModal } from './helpers/modal_containers';
import { CustomUploadModal } from './helpers/custom_modals/custom_upload_modal';

type NotebookPageBodyProps = {
  isNoteAvailable: boolean;
  notebooks: Array<{ path: string; id: string; dateCreated: string; dateModified: string; }>;
  createNotebook: (newNoteName: string) => void;
  renameNotebook: (newNoteName: string, noteId: string) => void;
  cloneNotebook: (newNoteName: string, noteId: string) => void;
  deleteNotebook: (noteId: string) => void;
  exportNotebook: (noteName: string, noteId: string) => void;
  importNotebook: (fileObj: any) => void;
  openNoteName: string;
  openNoteId: string;
};
export function NotebookPageBody(props: NotebookPageBodyProps) {
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal Toggle
  const [modalLayout, setModalLayout] = useState(<EuiOverlayMask></EuiOverlayMask>); // Modal Layout
  const [isActionPopoverOpen, setIsActionPopoverOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const tableRef = useRef();
  const {
    createNotebook,
    renameNotebook,
    cloneNotebook,
    deleteNotebook,
    exportNotebook,
    importNotebook,
    openNoteName,
    openNoteId,
  } = props;

  const closeModal = () => {
    setIsModalVisible(false);
  };
  const showModal = () => {
    setIsModalVisible(true);
  };

  const onCreate = async (newNoteName: string) => {
    createNotebook(newNoteName);
    closeModal();
  };

  const onRename = async (newNoteName: string) => {
    renameNotebook(newNoteName, openNoteId);
    closeModal();
  };

  const onClone = async () => {
    cloneNotebook(openNoteName + '_copy', openNoteId);
    closeModal();
  };

  const onDelete = async () => {
    deleteNotebook(openNoteId);
    closeModal();
  };

  const onExport = async () => {
    exportNotebook(openNoteName, openNoteId);
  };

  const onImport = async (file: FileList) => {
    const fr = new FileReader();
    let fileObject = {};
    fr.onload = function (e: ProgressEvent<FileReader>) {
      try {
        fileObject = JSON.parse(e.target.result.toString());
        importNotebook(fileObject);
      } catch {
        console.error('Imported file not valid json');
      }
    };

    fr.readAsText(file[0]);
    closeModal();
  };

  const createNote = () => {
    setModalLayout(
      getCustomModal(
        onCreate,
        closeModal,
        'Name',
        'Create notebook',
        'Cancel',
        'Create',
        undefined,
        'Enter a unique name to describe the purpose of this notebook. The name must be less than 50 characters.'
      )
    );
    showModal();
  };

  const renameNote = () => {
    setModalLayout(
      getCustomModal(
        onRename,
        closeModal,
        'Edit notebook name',
        'Please edit name',
        'Cancel',
        'Rename',
        openNoteName
      )
    );
    showModal();
  };

  const cloneNote = () => {
    setModalLayout(getCloneModal(closeModal, onClone));
    showModal();
  };

  const deleteNote = () => {
    setModalLayout(getDeleteModal(closeModal, onDelete));
    showModal();
  };

  const importNote = () => {
    setModalLayout(<CustomUploadModal runModal={onImport} closeModal={closeModal} />);
    showModal();
  };

  const popoverButton = (
    <EuiButton iconType="arrowDown" iconSide="right" onClick={() => setIsActionPopoverOpen(!isActionPopoverOpen)}>
      Actions
    </EuiButton>
  );

  const items = [
    <EuiContextMenuItem
      key="import_from_json"
      onClick={() => {
        setIsActionPopoverOpen(false);
      }}>
      Import from JSON
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="rename"
      disabled={true}
      onClick={() => {
        setIsActionPopoverOpen(false);
      }}>
      Rename
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="duplicate"
      onClick={() => {
        setIsActionPopoverOpen(false);
      }}>
      Duplicate
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="download_pdf"
      onClick={() => {
        setIsActionPopoverOpen(false);
      }}>
      Download .pdf
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="export_json"
      onClick={() => {
        setIsActionPopoverOpen(false);
      }}>
      Export JSON
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="delete"
      onClick={() => {
        setIsActionPopoverOpen(false);
      }}>
      Delete
    </EuiContextMenuItem>,
  ];

  const columns = [
    {
      field: 'path',
      name: 'Name',
      sortable: true,
      render: (value, record) => value,
    },
    {
      field: 'dateModified',
      name: 'Last updated',
      sortable: true,
      render: (value) => value,
    },
    {
      field: 'dateCreated',
      name: 'Created',
      sortable: true,
      render: (value) => value,
    },
  ] as Array<EuiTableFieldDataColumnType<{ path: string; id: string; dateCreated: string; dateModified: string; }>>;

  return (
    <>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle size="s">
            <h3>
              Notebooks
                <span className="panel-header-count"> ({'0'})</span>
            </h3>
          </EuiTitle>
          <EuiSpacer size='s' />
          <EuiText size="s" color="subdued">
            Use notebooks to create post-modern documents, build Live infrastructure reports, or foster explorative collaborations with data. Notebook now supports two types of input: markdown, and visualizations created from Kibana Visualize.{' '}
            <EuiLink external={true} href="/">Learn more</EuiLink>
          </EuiText>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          <EuiFlexGroup gutterSize='s'>
            <EuiFlexItem>
              <EuiPopover
                panelPaddingSize="none"
                button={popoverButton}
                isOpen={isActionPopoverOpen}
                closePopover={() => setIsActionPopoverOpen(false)}>
                <EuiContextMenuPanel items={items} />
              </EuiPopover>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButton fill onClick={() => createNote()}>
                Create notebook
                </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageBody>
        <EuiHorizontalRule margin='m' />
        <EuiFlexGroup gutterSize='m'>
          <EuiFlexItem grow={6}>
            <EuiFieldSearch
              fullWidth
              placeholder="Search notebooks"
              value={''}
              onChange={() => { }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={2}>
            <EuiSuperSelect
              options={[
                {
                  value: 'warning',
                  inputDisplay: 'Last updated',
                },
              ]}
              valueOfSelected={'warning'}
              onChange={() => { }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={2}>
            <EuiSuperSelect
              options={[
                {
                  value: 'warning',
                  inputDisplay: 'Created',
                },
              ]}
              valueOfSelected={'warning'}
              onChange={() => { }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiHorizontalRule margin='m' />
        {props.isNoteAvailable ? (
          <EuiInMemoryTable
            ref={tableRef}
            items={props.notebooks}
            itemId='id'
            columns={columns}
            pagination={{
              initialPageSize: 10,
              pageSizeOptions: [8, 10, 13],
            }}
            sorting={{
              sort: {
                field: 'dateModified',
                direction: 'desc',
              }
            }}
            allowNeutralSort={false}
            isSelectable={true}
            selection={{
              onSelectionChange: (items) => setSelectedItems(items),
            }}
          />
        ) : (
            <>
              <EuiSpacer size='xxl' />
              <EuiText textAlign='center'>
                <h2>No notebook</h2>
                <EuiText color="subdued">
                  Use notebooks to create post-modern documents, build Live infrastructure reports, or<br />
            foster explorative collaborations with data. Notebooks now supports two types of input:<br />
            markdown, and visualizations created from Kibana Visualize.{' '}
                  <EuiLink external={true} href="/">Learn more</EuiLink>
                </EuiText>
              </EuiText>
              <EuiSpacer size='s' />
              <EuiFlexGroup justifyContent='spaceAround'>
                <EuiFlexItem grow={false}>
                  <EuiButton fullWidth={false} onClick={() => createNote()}>
                    Create notebook
            </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size='xxl' />
            </>
          )}
      </EuiPageBody>
      {isModalVisible && modalLayout}
    </>
  );
};

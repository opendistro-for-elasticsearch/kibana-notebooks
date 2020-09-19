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

import {
  EuiButton,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiInMemoryTable,
  EuiLink,
  EuiOverlayMask,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiPopover,
  EuiSpacer,
  EuiTableFieldDataColumnType,
  EuiText,
  EuiTitle
} from '@elastic/eui';
import _ from 'lodash';
import moment from 'moment';
import React, { useEffect, useState, ReactElement } from 'react';
import { ChromeBreadcrumb } from '../../../../src/core/public';
import { DATE_FORMAT } from '../../common';
import { CustomUploadModal } from './helpers/custom_modals/custom_upload_modal';
import { getCloneModal, getCustomModal, DeleteNotebookModal } from './helpers/modal_containers';
import { NotebookType } from './main';

type NoteTableProps = {
  fetchNotebooks: () => void;
  notebooks: Array<NotebookType>;
  createNotebook: (newNoteName: string) => void;
  renameNotebook: (newNoteName: string, noteId: string) => void;
  cloneNotebook: (newNoteName: string, noteId: string) => void;
  deleteNotebook: (noteId: string, noteName?: string, showToast?: boolean) => void;
  exportNotebook: (noteName: string, noteId: string) => void;
  importNotebook: (fileObj: any) => void;
  setBreadcrumbs: (newBreadcrumbs: ChromeBreadcrumb[]) => void;
  setToast: (title: string, color?: string, text?: string) => void;
};

export function NoteTable(props: NoteTableProps) {
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal Toggle
  const [modalLayout, setModalLayout] = useState(<EuiOverlayMask></EuiOverlayMask>); // Modal Layout
  const [isActionsPopoverOpen, setIsActionsPopoverOpen] = useState(false);
  const [selectedNotebooks, setSelectedNotebooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    notebooks,
    createNotebook,
    renameNotebook,
    cloneNotebook,
    deleteNotebook,
    exportNotebook,
    importNotebook,
  } = props;

  useEffect(() => {
    props.setBreadcrumbs([
      {
        text: 'Notebooks',
        href: '#',
      },
    ]);
    props.fetchNotebooks();
  }, []);

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
    renameNotebook(newNoteName, selectedNotebooks[0].id);
    closeModal();
  };

  const onClone = async () => {
    cloneNotebook(selectedNotebooks[0].path + ' (copy)', selectedNotebooks[0].id);
    closeModal();
  };

  const onDelete = async () => {
    const toastMessage = `Notebook${selectedNotebooks.length > 1 ?
      's' : ' ' + selectedNotebooks[0].path} successfully deleted!`;
    Promise.all(selectedNotebooks.map((notebook) => deleteNotebook(notebook.id, undefined, false)))
      .then(() => props.setToast(toastMessage))
      .catch((error) => props.setToast('Issue in deleting notebooks' + error.body.message, 'danger'));
    closeModal();
  };

  const onExport = async () => {
    exportNotebook(selectedNotebooks[0].path, selectedNotebooks[0].id);
  };

  const onImport = async (file: FileList) => {
    const fr = new FileReader();
    let fileObject = {};
    fr.onload = function (e: ProgressEvent<FileReader>) {
      try {
        fileObject = JSON.parse(e.target.result.toString());
        importNotebook(fileObject);
      } catch {
        props.setToast('Imported file not valid json', 'danger');
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
        selectedNotebooks[0].path,
        'Enter a unique name to describe the purpose of this notebook. The name must be less than 50 characters.'
      )
    );
    showModal();
  };

  const cloneNote = () => {
    setModalLayout(getCloneModal(closeModal, onClone));
    showModal();
  };

  const deleteNote = () => {
    setModalLayout(
      <DeleteNotebookModal
        onConfirm={onDelete}
        onCancel={closeModal}
        title={"Delete selected notebooks"}
        message="Are you sure you want to delete the selected notebooks?"
      />
    );
    showModal();
  };

  const importNote = () => {
    setModalLayout(<CustomUploadModal runModal={onImport} closeModal={closeModal} />);
    showModal();
  };

  const popoverButton = (
    <EuiButton iconType="arrowDown" iconSide="right" onClick={() => setIsActionsPopoverOpen(!isActionsPopoverOpen)}>
      Actions
    </EuiButton>
  );

  const popoverItems: ReactElement[] = [
    // show `Import from JSON` only if no notebooks are selected
    selectedNotebooks.length === 0 ? <EuiContextMenuItem
      key="import_from_json"
      onClick={() => {
        setIsActionsPopoverOpen(false);
        importNote();
      }}>
      <EuiText className="eui-color-primary">Import from JSON</EuiText>
    </EuiContextMenuItem> : null,
    <EuiContextMenuItem
      key="rename"
      disabled={selectedNotebooks.length !== 1}
      onClick={() => {
        setIsActionsPopoverOpen(false);
        renameNote();
      }}>
      Rename
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="duplicate"
      disabled={selectedNotebooks.length !== 1}
      onClick={() => {
        setIsActionsPopoverOpen(false);
        cloneNote();
      }}>
      Duplicate
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="export_json"
      disabled={selectedNotebooks.length !== 1}
      onClick={() => {
        setIsActionsPopoverOpen(false);
        onExport();
      }}>
      Export JSON
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="delete"
      disabled={selectedNotebooks.length === 0}
      onClick={() => {
        setIsActionsPopoverOpen(false);
        deleteNote();
      }}>
      Delete
    </EuiContextMenuItem>,
  ];

  const tableColumns = [
    {
      field: 'path',
      name: 'Name',
      sortable: true,
      truncateText: true,
      render: (value, record) =>
        <EuiLink href={`#${record.id}`}>{_.truncate(value, { 'length': 100 })}</EuiLink>,
    },
    {
      field: 'dateModified',
      name: 'Last updated',
      sortable: true,
      render: (value) => moment(value).format(DATE_FORMAT),
    },
    {
      field: 'dateCreated',
      name: 'Created',
      sortable: true,
      render: (value) => moment(value).format(DATE_FORMAT),
    },
  ] as Array<EuiTableFieldDataColumnType<{ path: string; id: string; dateCreated: string; dateModified: string; }>>;

  return (
    <>
      <EuiPage>
        <EuiPageBody component="div">
          <EuiPageHeader>
            <EuiPageHeaderSection>
              <EuiTitle size="l">
                <h1>Notebooks</h1>
              </EuiTitle>
            </EuiPageHeaderSection>
          </EuiPageHeader>
          <EuiPageContent id="notebookArea">
            <EuiPageContentHeader>
              <EuiPageContentHeaderSection>
                <EuiTitle size="s">
                  <h3>Notebooks<span className="panel-header-count"> ({notebooks.length})</span></h3>
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
                      isOpen={isActionsPopoverOpen}
                      closePopover={() => setIsActionsPopoverOpen(false)}>
                      <EuiContextMenuPanel items={popoverItems.filter((item) => item)} />
                    </EuiPopover>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiButton fill onClick={() => createNote()}>Create notebook</EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiHorizontalRule margin='m' />
            <EuiFieldSearch
              fullWidth
              placeholder="Search notebooks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <EuiHorizontalRule margin='m' />
            {notebooks.length > 0 ? (
              <EuiInMemoryTable
                items={searchQuery ?
                  notebooks.filter((notebook) => notebook.path.toLowerCase().includes(searchQuery.toLowerCase())) :
                  notebooks}
                itemId='id'
                columns={tableColumns}
                tableLayout='auto'
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
                  onSelectionChange: (items) => setSelectedNotebooks(items),
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
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
      {isModalVisible && modalLayout}
    </>
  );
};

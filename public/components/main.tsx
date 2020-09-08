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

import React from 'react';

import { CoreStart, ChromeBreadcrumb } from '../../../../src/core/public';
import { DashboardStart } from '../../../../src/plugins/dashboard/public';

import { Notebook } from './notebook';
import { onDownload } from './helpers/download_json';
import { API_PREFIX } from '../../common';
import { NoteTable } from './note_table';

/*
 * "Main" component renders the whole Notebooks as a single page application
 *
 * Props taken in as params are:
 * DashboardContainerByValueRenderer: Dashboard container renderer for visualization
 * http object: for making API requests
 *
 * Cell component of nteract used as a container for paragraphs in notebook UI.
 * https://components.nteract.io/#cell
 */

type MainProps = {
  DashboardContainerByValueRenderer: DashboardStart['DashboardContainerByValueRenderer'];
  http: CoreStart['http'];
  setBreadcrumbs: (newBreadcrumbs: ChromeBreadcrumb[]) => void;
};

type MainState = {
  data: Array<NotebookType>;
  openedNotebook: NotebookType;
};

export type NotebookType = {
  path: string;
  id: string;
  dateCreated: string;
  dateModified: string;
}

export class Main extends React.Component<MainProps, MainState> {
  constructor(props: Readonly<MainProps>) {
    super(props);
    this.state = {
      data: [],
      openedNotebook: undefined,
    };
    this.setOpenedNotebook = this.setOpenedNotebook.bind(this);
  }

  setOpenedNotebook(notebook: NotebookType) {
    this.setState({ openedNotebook: notebook });
  }

  // Fetches path and id for all stored notebooks
  fetchNotebooks = () => {
    this.props.http
      .get(`${API_PREFIX}/`)
      .then((res) => this.setState(res))
      .catch((err) => {
        console.error('Issue in fetching the notebooks', err.body.message);
      });
  };

  // Creates a new notebook
  createNotebook = (newNoteName: string) => {
    const newNoteObject = {
      name: newNoteName,
    };

    this.props.http
      .post(`${API_PREFIX}/note`, {
        body: JSON.stringify(newNoteObject),
      })
      .then((res) => this.fetchNotebooks())
      .catch((err) => console.error('Issue in creating a notebook', err.body.message));
  };

  // Renames an existing notebook
  renameNotebook = (editedNoteName: string, editedNoteID: string) => {
    const renameNoteObject = {
      name: editedNoteName,
      noteId: editedNoteID,
    };

    this.props.http
      .put(`${API_PREFIX}/note/rename`, {
        body: JSON.stringify(renameNoteObject),
      })
      .then((res) => this.fetchNotebooks())
      .catch((err) => console.error('Issue in renaming the notebook', err.body.message));
  };

  // Clones an existing notebook
  cloneNotebook = (clonedNoteName: string, clonedNoteID: string) => {
    const cloneNoteObject = {
      name: clonedNoteName,
      noteId: clonedNoteID,
    };

    this.props.http
      .post(`${API_PREFIX}/note/clone`, {
        body: JSON.stringify(cloneNoteObject),
      })
      .then((res) => this.fetchNotebooks())
      .catch((err) => console.error('Issue in cloning the notebook', err.body.message));
  };

  // Deletes an existing notebook
  deleteNotebook = (clonedNoteID: string) => {
    this.props.http
      .delete(`${API_PREFIX}/note/` + clonedNoteID)
      .then((res) => this.fetchNotebooks())
      .catch((err) => console.error('Issue in deleting the notebook', err.body.message));
  };

  // Exports an existing notebook
  exportNotebook = (exportNoteName: string, exportNoteId: string) => {
    this.props.http
      .get(`${API_PREFIX}/note/export/` + exportNoteId)
      .then((res) => {
        onDownload(res, exportNoteName + '.json');
      })
      .catch((err) => console.error('Issue in exporting the notebook', err.body.message));
  };

  // Imports a new notebook
  importNotebook = (noteObject: any) => {
    const importObject = {
      noteObj: noteObject,
    };
    this.props.http
      .post(`${API_PREFIX}/note/import`, { body: JSON.stringify(importObject) })
      .then((res) => this.fetchNotebooks())
      .catch((err) => console.error('Issue in importing the notebook', err.body.message));
  };

  // On mount fetch all notebooks
  componentDidMount() {
    this.fetchNotebooks();
  }

  render() {
    return (
      <>
        {this.state.openedNotebook ? (
          <Notebook
            openedNotebook={this.state.openedNotebook}
            setOpenedNotebook={this.setOpenedNotebook}
            DashboardContainerByValueRenderer={this.props.DashboardContainerByValueRenderer}
            http={this.props.http}
            setBreadcrumbs={this.props.setBreadcrumbs}
          />
        ) : (
            <NoteTable
              notebooks={this.state.data}
              setOpenedNotebook={this.setOpenedNotebook}
              createNotebook={this.createNotebook}
              renameNotebook={this.renameNotebook}
              cloneNotebook={this.cloneNotebook}
              deleteNotebook={this.deleteNotebook}
              exportNotebook={this.exportNotebook}
              importNotebook={this.importNotebook}
              setBreadcrumbs={this.props.setBreadcrumbs}
            />
          )}
      </>
    );
  }
}

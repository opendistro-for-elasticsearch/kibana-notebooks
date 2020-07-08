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

import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiPageSideBar,
  EuiTitle,
  EuiTreeView,
  EuiIcon,
} from '@elastic/eui';
import NoteButtons from './notebuttons';
import NBCell from './nbcell';

export class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      noteOpen: [],
      noteName: [],
      folderTree: [
        {
          label: 'Base Path',
          id: 'Base_path',
          icon: <EuiIcon type="folderClosed" />,
          iconWhenExpanded: <EuiIcon type="folderOpen" />,
          isExpanded: true,
          children: [],
        },
      ],
    };
  }

  createNewNotebook = async newNoteName => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'reporting' },
      body: JSON.stringify({
        name: newNoteName,
      }),
    };
    const response = await fetch('../push/newNotebook', requestOptions);
    const body = response.json();
    return body;
  };

  newNotebook = newNoteName => {
    let newNoteId = '';
    this.createNewNotebook(newNoteName)
      .then(res => {
        newNoteId = res.body;
      })
      .catch(err => console.log(err));

    this.fetchData()
      .then(res => this.setState(res, this.realodSidePanel))
      .catch(err => console.log(err));
    // this.reloadNotebooks(newNoteId, newNoteName);
  };

  reloadNotebooks = (nbId, nbName) => {
    this.setState({ noteOpen: nbId });
    this.setState({ noteName: nbName });
  };

  realodSidePanel = () => {
    let folderTree = this.state.folderTree;
    let noteArray = [];
    this.state.data.map(notebook => {
      const noteName = notebook.path.split('/').pop();
      const noteObj = {
        label: noteName,
        id: notebook.id,
        icon: <EuiIcon type="notebookApp" />,
        callback: () => this.reloadNotebooks(notebook.id, noteName),
      };
      noteArray.push(noteObj);
    });

    folderTree[0].children = noteArray;
    console.log('tree', folderTree);
    this.setState({ folderTree });
  };

  setNoteOpen = () => {
    const noteOpen = this.state.data[0].id;
    const noteName = this.state.data[0].path.split('/').pop();
    console.log('default', noteOpen);
    this.setState({ noteOpen });
    this.setState({ noteName });
    this.realodSidePanel();
  };

  fetchData = async () => {
    const response = await fetch('../get/all_notebooks');
    const body = response.json();
    return body;
  };

  componentDidMount() {
    this.fetchData()
      .then(res => this.setState(res, this.setNoteOpen))
      .catch(err => console.log(err));
  }

  render() {
    return (
      <EuiPage>
        <EuiPageSideBar>
          <div>
            <EuiTreeView items={this.state.folderTree} aria-label="Sample Folder Tree" />
          </div>
        </EuiPageSideBar>
        <EuiPageBody component="div">
          <EuiPageHeader>
            <EuiPageHeaderSection>
              <div>
                <EuiTitle size="l">
                  <h1>Kibana Notebooks</h1>
                </EuiTitle>
              </div>
            </EuiPageHeaderSection>
            <NoteButtons newNotebook={this.newNotebook} />
          </EuiPageHeader>
          <EuiPageContent style={{ maxWidth: '88vw' }}>
            <NBCell noteId={this.state.noteOpen} noteName={this.state.noteName} />
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}

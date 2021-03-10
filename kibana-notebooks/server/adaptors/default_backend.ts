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

import { v4 as uuid } from 'uuid';
import { NotebookAdaptor } from './notebook_adaptor';
import { ILegacyClusterClient, ILegacyScopedClusterClient } from '../../../../src/core/server';
import { optionsType } from '../../common';
import {
  DefaultNotebooks,
  DefaultParagraph,
  DefaultInput,
  DefaultOutput,
} from '../helpers/default_notebook_schema';
import { formatNotRecognized, inputIsQuery } from '../helpers/query_helpers';
import now from "performance-now";

export class DefaultBackend implements NotebookAdaptor {
  backend = 'Default Backend';

  // Creates a new notebooks with sample markdown text
  createNewNotebook = (newNotebookName: string) => {
    const noteObject: DefaultNotebooks = {
      dateCreated: new Date().toISOString(),
      name: newNotebookName,
      dateModified: new Date().toISOString(),
      backend: 'Default',
      paragraphs: [],
    };

    return {
      object: noteObject,
    };
  };

  // indexes a notebook with body provided
  indexNote = async function (
    client: ILegacyScopedClusterClient,
    body: any
  ): Promise<{ notebookId: string }> {
    try {
      const response = await client.callAsCurrentUser('notebooks.createNotebook', {
        body: {
          notebook: body,
        },
      });
      return response;
    } catch (error) {
      throw new Error('Index Doc Error:' + error);
    }
  };

  // updates a notebook with updateBody provided as parameter
  updateNote = async function (
    client: ILegacyScopedClusterClient,
    noteId: string,
    updateBody: Partial<DefaultNotebooks>
  ) {
    try {
      const response = await client.callAsCurrentUser('notebooks.updateNotebookById', {
        notebookId: noteId,
        body: {
          notebook: updateBody,
        },
      });
      return response;
    } catch (error) {
      throw new Error('Update Doc Error:' + error);
    }
  };

  // fetched a notebook by Id
  getNote = async function (client: ILegacyScopedClusterClient, noteId: string) {
    try {
      const response = await client.callAsCurrentUser('notebooks.getNotebookById', {
        notebookId: noteId,
      });
      return response.notebookDetails;
    } catch (error) {
      throw new Error('Get Doc Error:' + error);
    }
  };

  // gets first `FETCH_SIZE` notebooks available
  viewNotes = async function (client: ILegacyScopedClusterClient, _wreckOptions: optionsType) {
    try {
      const response = await client.callAsCurrentUser('notebooks.getNotebooks');
      return response.notebookDetailsList.map((notebook) => ({
        path: notebook.notebook.name,
        id: notebook.id,
        dateCreated: notebook.notebook.dateCreated,
        dateModified: notebook.notebook.dateModified,
      }));
    } catch (error) {
      if (error.body.error.type === 'index_not_found_exception') {
        return [];
      } else throw new Error('View Notebooks Error:' + error);
    }
  };

  /* Fetches a notebook by id
   * Param: noteId -> Id of notebook to be fetched
   */
  fetchNote = async function (
    client: ILegacyScopedClusterClient,
    noteId: string,
    _wreckOptions: optionsType
  ) {
    try {
      const noteObject = await this.getNote(client, noteId);
      return {
        path: noteObject.notebook.name,
        dateCreated: noteObject.notebook.dateCreated,
        dateModified: noteObject.notebook.dateModified,
        paragraphs: noteObject.notebook.paragraphs,
      };
    } catch (error) {
      throw new Error('Fetching Notebook Error:' + error);
    }
  };

  /* Adds a notebook to storage
   * Param: name -> name of new notebook
   */
  addNote = async function (
    client: ILegacyScopedClusterClient,
    params: { name: string },
    _wreckOptions: optionsType
  ) {
    try {
      const newNotebook = this.createNewNotebook(params.name);
      const esClientResponse = await this.indexNote(client, newNotebook.object);
      return { status: 'OK', message: esClientResponse, body: esClientResponse.notebookId };
    } catch (error) {
      throw new Error('Creating New Notebook Error:' + error);
    }
  };

  /* Renames a notebook
   * Params: name -> new name for the notebook to be renamed
   *         noteId -> Id of notebook to be fetched
   */
  renameNote = async function (
    client: ILegacyScopedClusterClient,
    params: { name: string; noteId: string },
    _wreckOptions: optionsType
  ) {
    try {
      const updateNotebook = {
        name: params.name,
        dateModified: new Date().toISOString(),
      };
      const esClientResponse = await this.updateNote(client, params.noteId, updateNotebook);
      return { status: 'OK', message: esClientResponse };
    } catch (error) {
      throw new Error('Renaming Notebook Error:' + error);
    }
  };

  /* Clone a notebook
   * Params: name -> new name for the cloned notebook
   *         noteId -> Id for the notebook to be cloned
   */
  cloneNote = async function (
    client: ILegacyScopedClusterClient,
    params: { name: string; noteId: string },
    _wreckOptions: optionsType
  ) {
    try {
      const noteObject = await this.getNote(client, params.noteId);
      const newNotebook = this.createNewNotebook(params.name);
      const cloneNotebook = { ...newNotebook.object };
      cloneNotebook.paragraphs = noteObject.notebook.paragraphs;
      const esClientIndexResponse = await this.indexNote(client, cloneNotebook);
      return { status: 'OK', body: { ...cloneNotebook, id: esClientIndexResponse.notebookId } };
    } catch (error) {
      throw new Error('Cloning Notebook Error:' + error);
    }
  };

  /* Delete a notebook
   * Param: noteId -> Id for the notebook to be deleted
   */
  deleteNote = async function (
    client: ILegacyScopedClusterClient,
    noteId: string,
    _wreckOptions: optionsType
  ) {
    try {
      const response = await client.callAsCurrentUser('notebooks.deleteNotebookById', {
        notebookId: noteId,
      });
      return { status: 'OK', message: response };
    } catch (error) {
      throw new Error('Deleting Notebook Error:' + error);
    }
  };

  /* Export a notebook
   * Param: noteId -> Id for the notebook to be exported
   */
  exportNote = async function (
    client: ILegacyScopedClusterClient,
    noteId: string,
    _wreckOptions: optionsType
  ) {
    try {
      const esClientGetResponse = await this.getNote(client, noteId);
      return { status: 'OK', body: esClientGetResponse };
    } catch (error) {
      throw new Error('Export Notebook Error:' + error);
    }
  };

  /* Import a notebook
   * Params: noteObj -> note Object to be imported
   */
  importNote = async function (
    client: ILegacyScopedClusterClient,
    noteObj: any,
    _wreckOptions: optionsType
  ) {
    try {
      let newNoteObject = { ...noteObj };
      newNoteObject.id = 'note_' + uuid();
      newNoteObject.dateCreated = new Date().toISOString();
      newNoteObject.dateModified = new Date().toISOString();
      const esClientIndexResponse = await this.indexNote(client, newNoteObject);
      return { status: 'OK', message: esClientIndexResponse, body: esClientIndexResponse.notebookId };
    } catch (error) {
      throw new Error('Import Notebook Error:' + error);
    }
  };

  /* Updates input for required paragraphs
   * Params: paragraphs -> list of paragraphs
   *         paragraphId -> Id of paragraph to be updated
   *         paragraphInput -> Input to be added
   */
  updateParagraphInput = function (
    paragraphs: Array<DefaultParagraph>,
    paragraphId: string,
    paragraphInput: string
  ) {
    try {
      const updatedParagraphs: DefaultParagraph[] = [];
      paragraphs.map((paragraph: DefaultParagraph) => {
        const updatedParagraph = { ...paragraph };
        if (paragraph.id === paragraphId) {
          updatedParagraph.dateModified = new Date().toISOString();
          updatedParagraph.input.inputText = paragraphInput;
        }
        updatedParagraphs.push(updatedParagraph);
      });
      return updatedParagraphs;
    } catch (error) {
      throw new Error('Update Paragraph Error:' + error);
    }
  };

  // Creates new paragraph with the given input and input type
  createParagraph = function (paragraphInput: string, inputType: string) {
    try {
      let paragraphType = 'MARKDOWN';
      if (inputType === 'VISUALIZATION') {
        paragraphType = 'VISUALIZATION';
      }
      if (paragraphInput.substring(0, 3) === '%sql' || paragraphInput.substring(0, 3) === '%ppl') {
        paragraphType = 'QUERY';
      }
      const inputObject = {
        inputType: paragraphType,
        inputText: paragraphInput,
      };
      const outputObjects: Array<DefaultOutput> = [
        {
          outputType: paragraphType,
          result: '',
          execution_time: '0s',
        },
      ];
      const newParagraph = {
        id: 'paragraph_' + uuid(),
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        input: inputObject,
        output: outputObjects,
      };

      return newParagraph;
    } catch (error) {
      throw new Error('Create Paragraph Error:' + error);
    }
  };

  /* Runs a paragraph
   * Currently only runs markdown by copying input.inputText to result
   * UI renders Markdown
   */
  runParagraph = async function (paragraphs: Array<DefaultParagraph>, paragraphId: string, client: ILegacyScopedClusterClient) {
    try {
      const updatedParagraphs = [];
      let index = 0;
      for (index = 0; index < paragraphs.length; ++index) {
        const startTime = now();
        const updatedParagraph = { ...paragraphs[index] };
        if (paragraphs[index].input.inputType === 'MARKDOWN' && paragraphs[index].id === paragraphId) {
          updatedParagraph.dateModified = new Date().toISOString();
          if (inputIsQuery(paragraphs[index].input.inputText)) {
            updatedParagraph.output = [
              {
                outputType: 'QUERY',
                result: paragraphs[index].input.inputText.substring(4, paragraphs[index].input.inputText.length),
                execution_time: `${(now() - startTime).toFixed(3)} ms`,
              },
            ];
          } else if (paragraphs[index].input.inputText.substring(0, 3) === '%md') {
            updatedParagraph.output = [
              {
                outputType: 'MARKDOWN',
                result: paragraphs[index].input.inputText.substring(4, paragraphs[index].input.inputText.length),
                execution_time: `${(now() - startTime).toFixed(3)} ms`,
              },
            ];
          } else if (paragraphs[index].input.inputType === 'VISUALIZATION' && paragraphs[index].id === paragraphId) {
            updatedParagraph.dateModified = new Date().toISOString();
            updatedParagraph.output = [
              {
                outputType: 'VISUALIZATION',
                result: '',
                execution_time: `${(now() - startTime).toFixed(3)} ms`,
              },
            ];
          } else if (formatNotRecognized(paragraphs[index].input.inputText)) {
            updatedParagraph.output = [
              {
                outputType: 'MARKDOWN',
                result: 'Please select an input type (%sql, %ppl, or %md)',
                execution_time: `${(now() - startTime).toFixed(3)} ms`,
              },
            ];
          }
        }
        updatedParagraphs.push(updatedParagraph);
      }
      return updatedParagraphs;
    } catch (error) {
      throw new Error('Running Paragraph Error:' + error);
    }
  };

  /* --> Updates a Paragraph with input content
   * --> Runs it
   * --> Updates the notebook in index
   * --> Fetches the updated Paragraph (with new input content and output result)
   * Params: noteId -> Id of the notebook
   *         paragraphId -> Id of the paragraph to be updated
   *         paragraphInput -> paragraph input code
   */
  updateRunFetchParagraph = async function (
    client: ILegacyClusterClient,
    request: any,
    _wreckOptions: optionsType
  ) {
    try {
      const scopedClient = client.asScoped(request);
      const params = request.body;
      const esClientGetResponse = await this.getNote(scopedClient, params.noteId);
      const updatedInputParagraphs = this.updateParagraphInput(
        esClientGetResponse.notebook.paragraphs,
        params.paragraphId,
        params.paragraphInput
      );
      const updatedOutputParagraphs = await this.runParagraph(
        updatedInputParagraphs,
        params.paragraphId,
        client
      );
      const updateNotebook = {
        paragraphs: updatedOutputParagraphs,
        dateModified: new Date().toISOString(),
      };
      const esClientResponse = await this.updateNote(scopedClient, params.noteId, updateNotebook);
      let resultParagraph = {};
      let index = 0;

      for (index = 0; index < updatedOutputParagraphs.length; ++index) {
        if (params.paragraphId === updatedOutputParagraphs[index].id) {
          resultParagraph = updatedOutputParagraphs[index];
        }
      };
      return resultParagraph;
    } catch (error) {
      throw new Error('Update/Run Paragraph Error:' + error);
    }
  };

  /* --> Updates a Paragraph with input content
   * --> Updates the notebook in index
   * --> Fetches the updated Paragraph (with new input content)
   * Params: noteId -> Id of the notebook
   *         paragraphId -> Id of the paragraph to be updated
   *         paragraphInput -> paragraph input code
   */
  updateFetchParagraph = async function (
    client: ILegacyScopedClusterClient,
    params: { noteId: string; paragraphId: string; paragraphInput: string },
    _wreckOptions: optionsType
  ) {
    try {
      const esClientGetResponse = await this.getNote(client, params.noteId);
      const updatedInputParagraphs = this.updateParagraphInput(
        esClientGetResponse.notebook.paragraphs,
        params.paragraphId,
        params.paragraphInput
      );

      const updateNotebook = {
        paragraphs: updatedInputParagraphs,
        dateModified: new Date().toISOString(),
      };
      const esClientResponse = await this.updateNote(client, params.noteId, updateNotebook);

      let resultParagraph = {};
      updatedInputParagraphs.map((paragraph: DefaultParagraph) => {
        if (params.paragraphId === paragraph.id) {
          resultParagraph = paragraph;
        }
      });
      return resultParagraph;
    } catch (error) {
      throw new Error('Save Paragraph Error:' + error);
    }
  };

  /* --> Fetches the Paragraph
   * --> Adds a Paragraph with input content
   * --> Updates the notebook in index
   * Params: noteId -> Id of the notebook
   *         paragraphId -> Id of the paragraph to be fetched
   */
  addFetchNewParagraph = async function (
    client: ILegacyScopedClusterClient,
    params: { noteId: string; paragraphIndex: number; paragraphInput: string; inputType: string },
    _wreckOptions: optionsType
  ) {
    try {
      const esClientGetResponse = await this.getNote(client, params.noteId);
      const paragraphs = esClientGetResponse.notebook.paragraphs;
      const newParagraph = this.createParagraph(params.paragraphInput, params.inputType);
      paragraphs.splice(params.paragraphIndex, 0, newParagraph);
      const updateNotebook = {
        paragraphs: paragraphs,
        dateModified: new Date().toISOString(),
      };
      const esClientResponse = await this.updateNote(client, params.noteId, updateNotebook);

      return newParagraph;
    } catch (error) {
      throw new Error('add/Fetch Paragraph Error:' + error);
    }
  };

  /* --> Deletes a Paragraph with id
   * --> Fetches the all other Paragraphs as a list
   * --> Updates the notebook in index
   * Params: noteId -> Id of the notebook
   *         paragraphId -> Id of the paragraph to be deleted
   */
  deleteFetchParagraphs = async function (
    client: ILegacyScopedClusterClient,
    params: { noteId: string; paragraphId: string },
    _wreckOptions: optionsType
  ) {
    try {
      const esClientGetResponse = await this.getNote(client, params.noteId);
      const updatedparagraphs: DefaultParagraph[] = [];
      esClientGetResponse.notebook.paragraphs.map((paragraph: DefaultParagraph, index: number) => {
        if (paragraph.id !== params.paragraphId) {
          updatedparagraphs.push(paragraph);
        }
      });

      const updateNotebook = {
        paragraphs: updatedparagraphs,
        dateModified: new Date().toISOString(),
      };
      const esClientResponse = await this.updateNote(client, params.noteId, updateNotebook);

      return { paragraphs: updatedparagraphs };
    } catch (error) {
      console.log('error', error);
      throw new Error('Delete Paragraph Error:' + error);
    }
  };

  /* --> Clears output for all the paragraphs
   * --> Fetches the all Paragraphs as a list (with cleared outputs)
   * --> Updates the notebook in index
   * Param: noteId -> Id of notebook to be cleared
   */
  clearAllFetchParagraphs = async function (
    client: ILegacyScopedClusterClient,
    params: { noteId: string },
    _wreckOptions: optionsType
  ) {
    try {
      const esClientGetResponse = await this.getNote(client, params.noteId);
      let updatedparagraphs: DefaultParagraph[] = [];
      esClientGetResponse.notebook.paragraphs.map((paragraph: DefaultParagraph, index: number) => {
        let updatedParagraph = { ...paragraph };
        updatedParagraph.output = [];
        updatedparagraphs.push(updatedParagraph);
      });

      const updateNotebook = {
        paragraphs: updatedparagraphs,
        dateModified: new Date().toISOString(),
      };
      const esClientResponse = await this.updateNote(client, params.noteId, updateNotebook);

      return { paragraphs: updatedparagraphs };
    } catch (error) {
      throw new Error('Clear Paragraph Error:' + error);
    }
  };
}

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

import { NotebookAdaptor } from './notebook_adaptor';
import { RequestHandlerContext } from '../../../../src/core/server';
import { optionsType } from '../../common';

//NOTE: Placeholder for default adaptor
export class DefaultBackend implements NotebookAdaptor {
  backend = 'Default Backend';

  // Gets all the notebooks available
  viewNotes: (context: RequestHandlerContext, wreckOptions: optionsType) => Promise<any[]>;

  // Fetches a notebook by id
  fetchNote: (
    context: RequestHandlerContext,
    noteId: string,
    wreckOptions: optionsType
  ) => Promise<any[]>;

  // Adds a notebook to storage
  addNote: (
    context: RequestHandlerContext,
    params: { name: string },
    wreckOptions: optionsType
  ) => Promise<any>;

  // Renames a notebook
  renameNote: (
    context: RequestHandlerContext,
    params: { name: string; noteId: string },
    wreckOptions: optionsType
  ) => Promise<any>;

  // Clones a notebook
  cloneNote: (
    context: RequestHandlerContext,
    params: { name: string; noteId: string },
    wreckOptions: optionsType
  ) => Promise<any>;

  // Deletes a notebook
  deleteNote: (
    context: RequestHandlerContext,
    noteId: string,
    wreckOptions: optionsType
  ) => Promise<any>;

  // Export a notebook
  exportNote: (
    context: RequestHandlerContext,
    noteId: string,
    wreckOptions: optionsType
  ) => Promise<any>;

  // Import a notebook
  importNote: (
    context: RequestHandlerContext,
    noteObj: any,
    wreckOptions: optionsType
  ) => Promise<any>;

  // Update and Run a para in a notebook
  updateRunPara: (
    context: RequestHandlerContext,
    params: { noteId: string; paragraphId: string; paragraphInput: string },
    wreckOptions: optionsType
  ) => Promise<any>;

  // Update and Run a para in a notebook
  updateFetchPara: (
    context: RequestHandlerContext,
    params: { noteId: string; paragraphId: string; paragraphInput: string },
    wreckOptions: optionsType
  ) => Promise<any>;

  // Add a new and return the new para in a notebook
  addNewPara: (
    context: RequestHandlerContext,
    params: { noteId: string; paragraphIndex: string; paragraphInput: string },
    wreckOptions: optionsType
  ) => Promise<any>;

  // delete a para and return all other paras in a notebook
  deleteFetchPara: (
    context: RequestHandlerContext,
    params: { noteId: string; paragraphId: string },
    wreckOptions: optionsType
  ) => Promise<{ paragraphs: any }>;

  // clear outputs of all paras and return all paras in a notebook
  clearFetchPara: (
    context: RequestHandlerContext,
    params: { noteId: string },
    wreckOptions: optionsType
  ) => Promise<{ paragraphs: any }>;
}

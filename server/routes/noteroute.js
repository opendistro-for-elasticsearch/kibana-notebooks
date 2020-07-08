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

const Wreck = require('@hapi/wreck');

const addNote = async function(restoptions, params) {
  //http://[zeppelin-server]:[zeppelin-port]/api/notebook
  restoptions.payload = params;
  const promise = Wreck.request('POST', 'api/notebook/', restoptions);
  try {
    const res = await promise;
    const body = await Wreck.read(res, restoptions);
    console.log('Hapi server says: wreck addNote - ', JSON.parse(body));
    const respBody = JSON.parse(body);
    return respBody;
  } catch (err) {
    console.log(err);
  }
  delete restoptions.payload;
};

const getnotebooks = async function(restoptions) {
  //http://[zeppelin-server]:[zeppelin-port]/api/notebook
  const promise = Wreck.request('GET', 'api/notebook/', restoptions);
  try {
    const res = await promise;
    const body = await Wreck.read(res, restoptions);
    return JSON.parse(body).body;
  } catch (err) {
    console.log(err);
  }
};

const getnoteinfo = async function(restoptions, noteid) {
  //http://[zeppelin-server]:[zeppelin-port]/api/notebook/[noteId]
  const promise = Wreck.request('GET', 'api/notebook/' + noteid, restoptions);
  try {
    console.log('Hapi server says: wreck getnoteinfo - ', noteid);
    const res = await promise;
    const body = await Wreck.read(res, restoptions);
    console.log('wreck - getnoteinfo', JSON.parse(body).body.paragraphs);
    return JSON.parse(body).body.paragraphs;
  } catch (err) {
    console.log(err);
  }
};

export default function(server) {
  server.route({
    method: 'GET',
    path: '/get/all_notebooks',
    handler: async () => {
      const restoptions = server.app.restoptions;
      console.log('note server ', restoptions);
      const paragraphs = await getnotebooks(restoptions);
      return { data: paragraphs };
    },
  });

  server.route({
    method: 'GET',
    path: '/get/noteinfo/{noteid}',
    handler: async request => {
      const restoptions = server.app.restoptions;
      const notebookinfo = await getnoteinfo(restoptions, request.params.noteid);
      return { paragraphs: notebookinfo };
    },
  });

  server.route({
    method: 'POST',
    path: '/push/newNotebook',
    handler: async request => {
      const restoptions = server.app.restoptions;
      console.log('Hapi server says:', request.payload);
      let getinfo = {};
      try {
        const respBody = await addNote(restoptions, request.payload);
        if (respBody.status !== 'OK') throw console.error('Update para error');
        getinfo = respBody;
      } catch (err) {
        console.log('Hapi server says error in newNotebook', err);
      }
      return getinfo;
    },
  });
}

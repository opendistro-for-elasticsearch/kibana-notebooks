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

const updatepara = async function(restoptions, params) {
  //http://[zeppelin-server]:[zeppelin-port]/api/notebook/[noteId]/paragraph/[paragraphId]
  restoptions.payload = {
    text: params.parainp,
  };
  const promise = Wreck.request(
    'PUT',
    'api/notebook/' + params.noteid + '/paragraph/' + params.paraid,
    restoptions
  );
  try {
    const res = await promise;
    const body = await Wreck.read(res, restoptions);
    console.log('Hapi server says: wreck update - ', JSON.parse(body));
    return JSON.parse(body).status;
  } catch (err) {
    console.log(err);
  }
  delete restoptions.payload;
};

const deletepara = async function(restoptions, params) {
  //http://[zeppelin-server]:[zeppelin-port]/api/notebook/[noteId]/paragraph/[paragraphId]
  restoptions.payload = {};
  const promise = Wreck.request(
    'DELETE',
    'api/notebook/' + params.noteid + '/paragraph/' + params.paraid,
    restoptions
  );
  try {
    const res = await promise;
    const body = await Wreck.read(res, restoptions);
    console.log('Hapi server says: wreck update - ', JSON.parse(body));
    return JSON.parse(body).status;
  } catch (err) {
    console.log(err);
  }
  delete restoptions.payload;
};

const addpara = async function(restoptions, params) {
  //http://[zeppelin-server]:[zeppelin-port]/api/notebook/[noteId]/paragraph
  restoptions.payload = {
    title: 'Paragraph inserted',
    text: params.parainp,
    index: params.paraindex,
  };

  const promise = Wreck.request(
    'POST',
    'api/notebook/' + params.noteid + '/paragraph',
    restoptions
  );
  try {
    const res = await promise;
    const body = await Wreck.read(res, restoptions);
    console.log('Hapi server says: wreck addpara - ', JSON.parse(body));
    const respBody = JSON.parse(body);
    return respBody;
  } catch (err) {
    console.log(err);
  }
  delete restoptions.payload;
};

const runpara = async function(restoptions, params) {
  //http://[zeppelin-server]:[zeppelin-port]/api/notebook/run/[noteId]/[paragraphId]
  restoptions.payload = {};
  const promise = Wreck.request(
    'POST',
    'api/notebook/run/' + params.noteid + '/' + params.paraid,
    restoptions
  );
  try {
    const res = await promise;
    const body = await Wreck.read(res, restoptions);
    console.log('Hapi server says: wreck runpara - ', JSON.parse(body));
    return JSON.parse(body).status;
  } catch (err) {
    console.log(err);
  }
  delete restoptions.payload;
};

const getpara = async function(restoptions, params) {
  //http://[zeppelin-server]:[zeppelin-port]/api/notebook/[noteId]/paragraph/[paragraphId]
  const promise = Wreck.request(
    'GET',
    'api/notebook/' + params.noteid + '/paragraph/' + params.paraid,
    restoptions
  );
  try {
    const res = await promise;
    const body = await Wreck.read(res, restoptions);
    console.log('Hapi server says: wreck runpara - ', JSON.parse(body).body);
    return JSON.parse(body).body;
  } catch (err) {
    console.log(err);
  }
};

export default function(server) {
  server.route({
    method: 'POST',
    path: '/push/uprunpara/',
    handler: async request => {
      const restoptions = server.app.restoptions;
      console.log('Hapi server says:', request.payload);
      let getinfo = {};
      try {
        const updateinfo = await updatepara(restoptions, request.payload);
        if (updateinfo !== 'OK') throw console.error('Update para error');
        const runinfo = await runpara(restoptions, request.payload);
        if (runinfo !== 'OK') throw console.error('Run para error');
        getinfo = await getpara(restoptions, request.payload);
      } catch (err) {
        console.log('Hapi server says error in uprun para', err);
      }
      return getinfo;
    },
  });

  server.route({
    method: 'POST',
    path: '/push/uprunnotebook/',
    handler: async request => {
      const restoptions = server.app.restoptions;
      console.log('Hapi server says:', request.payload.notebookState);
      try {
        request.payload.notebookState.map(async params => {
          const updateinfo = await updatepara(restoptions, params);
          if (updateinfo !== 'OK') throw console.error('Update para error');
          const runinfo = await runpara(restoptions, params);
          if (runinfo !== 'OK') throw console.error('Run para error');
        });
      } catch (err) {
        console.log('Hapi server says error in uprun para in notebooks', err);
      } finally {
        try {
          const notebookinfo = await getnoteinfo(
            restoptions,
            request.payload.notebookState[0].noteid
          );
          console.log('Hapi server says ', notebookinfo);
          return { paragraphs: notebookinfo };
        } catch (err) {
          console.log('Hapi server says error in uprunnotebook para', err);
          return { paragraphs: [] };
        }
      }
    },
  });

  server.route({
    method: 'POST',
    path: '/push/addpara/',
    handler: async (request, h) => {
      const restoptions = server.app.restoptions;
      console.log('Hapi server says:', request.payload);
      let getinfo = {};
      try {
        const respBody = await addpara(restoptions, request.payload);
        if (respBody.status !== 'OK') throw console.error('Update para error');
        let payload = request.payload;
        payload.paraid = respBody.body;
        getinfo = await getpara(restoptions, payload);
      } catch (err) {
        console.log('Hapi server says error in addgetpara para', err);
      }
      return getinfo;
    },
  });

  server.route({
    method: 'POST',
    path: '/push/deletepara/',
    handler: async request => {
      const restoptions = server.app.restoptions;
      console.log('Hapi server says:', request.payload);
      const getinfo = {};
      try {
        const delinfo = await deletepara(restoptions, request.payload);
        if (delinfo !== 'OK') throw console.error('Update para error');
        const notebookinfo = await getnoteinfo(restoptions, request.payload.noteid);
        return { paragraphs: notebookinfo };
      } catch (err) {
        console.log('Hapi server says error in delpara para', err);
      }
      return getinfo;
    },
  });
}

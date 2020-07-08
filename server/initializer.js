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
const zeppelinURL = 'http://34.204.194.32:8080';

let restoptions = {
  baseUrl: zeppelinURL,
  headers: { 'Content-Type': 'application/json' },
};

const setcookie = function(cookieobj) {
  restoptions.headers = cookieobj;
  restoptions.headers['Content-Type'] = 'application/json';
};

const initializewreck = async function() {
  const initoptions = {
    baseUrl: zeppelinURL,
    payload: 'userName=kpuser&password=pass123',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  };
  const promise = Wreck.request('POST', '/api/login', initoptions);
  try {
    const res = await promise;
    const body = await Wreck.read(res, initoptions);
    return { cookie: res.headers['set-cookie'][4].split(';')[0] };
  } catch (err) {
    console.log('error in initializewreck', err);
  }
};

export default function(server) {
  async function start() {
    console.log('Here!Server running at:', server.info.uri);
    const cookieobj = await initializewreck();
    await setcookie(cookieobj);
    console.log('restoptions', restoptions);
    server.app.restoptions = restoptions;
  }

  start();
}

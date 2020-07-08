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

import { resolve } from 'path';
import { existsSync } from 'fs';

import initializer from './server/initializer';
import noteRoute from './server/routes/noteroute';
import paraRoute from './server/routes/pararoute';

export default function(kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'kibana_notebooks',
    uiExports: {
      app: {
        title: 'Kibana Notebooks',
        description: 'Kibana Notebooks ',
        main: 'plugins/kibana_notebooks/app',
      },
      styleSheetPaths: [
        resolve(__dirname, 'public/app.scss'),
        resolve(__dirname, 'public/app.css'),
      ].find(p => existsSync(p)),
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    // eslint-disable-next-line no-unused-vars
    init(server, options) {
      // Add server routes and initialize the plugin here
      initializer(server);
      noteRoute(server);
      paraRoute(server);
      const msg = `server address is: ${server.info.uri}`;
      server.log(['info'], msg);
    },
  });
}

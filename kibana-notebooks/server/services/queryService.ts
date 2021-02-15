/*
 *   Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import _ from 'lodash';

export default class QueryService {
  private client: any;
  constructor(client: any) {
    this.client = client;
  }

  describeQueryInternal = async (request: any, format: string, responseFormat: string) => {
    try {
      const queryRequest = {
        query: request.body.paragraphInput.substring(4, request.body.paragraphInput.length),
      };
      const params = {
        body: JSON.stringify(queryRequest),
      };
      // console.log('request is', request);
      // console.log('queryRequest is', queryRequest);
      // console.log('params is', params);
      console.log('request body paragraph input is', request.body.paragraphInput);
      const queryResponse = await this.client.asScoped(request).callAsCurrentUser(format, params);
      let responseObject = {
        output: [
          {
            outputType: 'QUERY',
            result: _.isEqual(responseFormat, 'json') ? JSON.stringify(queryResponse) : queryResponse,
            execution_time: '0s'
          }
        ],
        input: {
          inputText: queryRequest.query,
          inputType: 'QUERY'
        },
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        id: request.body.paragraphId
      }
      
      return {
        data: {
          ok: true,
          resp: responseObject
        },
      };
    } catch (err) {
      console.log(err);
      return {
        data: {
          ok: false,
          resp: err.message,
          body: err.body
        },
      };
    }
  };

  describeSQLQuery = async (request: any) => {
    return this.describeQueryInternal(request, 'sql.sqlQuery', 'json');
  };

  describePPLQuery = async (request: any) => {
    return this.describeQueryInternal(request, 'sql.pplQuery', 'json');
  };
}
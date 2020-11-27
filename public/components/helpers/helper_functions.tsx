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

import { CoreStart } from 'kibana/public';

// returns true if in global tenant or security plugin doesn't exist
export const isGlobalSecurityTenant = (http: CoreStart['http']) => {
  return http
    .get('/api/v1/configuration/account')
    .then((res) => {
      if (typeof res?.data?.user_requested_tenant === 'string')
        return res.data.user_requested_tenant === '';
      return true;
    })
    .catch((e) => true);
};

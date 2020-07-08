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

import React, { Component } from 'react';
import { Outputs } from '@nteract/presentational-components';
import { Media } from '@nteract/outputs';
import { EuiText } from '@elastic/eui';

class DynamicOut extends Component {
  state = {};

  dynamicBody(tidx, typeOut, val) {
    if (typeOut !== undefined) {
      switch (typeOut) {
        case 'HTML':
          return (
            <EuiText>
              <Media.HTML data={val} />
            </EuiText>
          );
        case 'TABLE':
          return <pre>{val}</pre>;
        case 'IMG':
          return <img alt="" src={'data:image/gif;base64,' + val} />;
        default:
          return <pre>{val}</pre>;
      }
    } else {
      console.log('output not supported', typeOut);
      return <pre />;
    }
  }

  render() {
    const { para } = this.props;
    return (
      <Outputs hidden={para.hiddenOutBool}>
        {para.typeOut.map((typeOut, tidx) => this.dynamicBody(tidx, typeOut, para.out[tidx]))}
      </Outputs>
    );
  }
}

export default DynamicOut;

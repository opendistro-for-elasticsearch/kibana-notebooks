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
import { Input, Prompt, Source } from '@nteract/presentational-components';

class DynamicInp extends Component {
  state = {};

  editorStyle = {
    fontFamily: `"Dank Mono", "Source Code Pro", Consolas, "Courier New", Courier,  monospace`,
    backgroundColor: `#fafafa`,
    color: `#212121`,
    fontSize: '1em',
    border: 'none',
    width: '100%',
    height: '10em',
  };
  render() {
    const { para, index, textValueEditor, handleKeyPress } = this.props;
    return (
      <Input hidden={para.hiddenInpBool}>
        <Prompt counter={para.id} running={para.runningBool} queued={para.queueBool} />
        <Source language={para.lang}>
          {para.selectBool ? (
            <textarea
              onChange={evt => textValueEditor(evt, index)}
              onKeyPress={evt => handleKeyPress(evt, para, index)}
              style={this.editorStyle}
              value={para.inp}
              autoFocus
            />
          ) : (
            para.inp
          )}
        </Source>
      </Input>
    );
  }
}

export default DynamicInp;

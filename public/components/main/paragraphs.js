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
import { Cell } from '@nteract/presentational-components';
import DynamicOut from './dynamicout';
import DynamicInp from './dynamicinp';

class Paragraphs extends Component {
  state = {};

  divStyle = {
    backgroundColor: '#e0fbfc',
    textAlign: 'center',
    color: '#98c1d9',
    fontWeight: 'bold',
  };

  render() {
    const {
      para,
      index,
      cellSelector,
      cellHover,
      cellHoverReset,
      textValueEditor,
      handleKeyPress,
      addParaHover,
      addPara,
    } = this.props;

    return (
      <div>
        <Cell
          key={index}
          _hovered={para.hoverBool}
          isSelected={para.selectBool}
          onClick={() => cellSelector(index)}
          onMouseEnter={() => cellHover(para)}
          onMouseLeave={() => cellHoverReset()}
        >
          <DynamicInp
            para={para}
            index={index}
            textValueEditor={textValueEditor}
            handleKeyPress={handleKeyPress}
          />
          <DynamicOut para={para} />
        </Cell>
        <div
          onMouseEnter={() => addParaHover(para)}
          onMouseLeave={() => addParaHover(para)}
          style={{ height: '1vh' }}
        >
          {para.addParaBool && (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <div onClick={() => addPara(para.id)} style={this.divStyle}>
              + Para
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Paragraphs;

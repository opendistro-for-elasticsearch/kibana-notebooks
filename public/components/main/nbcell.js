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
import {
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiTitle,
  EuiIcon,
} from '@elastic/eui';

import { Cells } from '@nteract/presentational-components';
import ParaButtons from './parabuttons';
import Paragraphs from './paragraphs';

class NBCell extends Component {
  constructor(props) {
    super(props);
    this.state = {
      paragraphs: [],
      parsedPara: [],
      langSupport: {
        '%sh': 'shell',
        '%md': 'md',
        '%python': 'python',
        '%odfesql': 'sql',
        '%elastic': 'json',
      },
      toggleOutput: true,
      toggleInput: true,
    };
  }

  parseLang = textHeader => {
    const tempLang = this.state.langSupport[textHeader];
    if (tempLang !== undefined) {
      return tempLang;
    } else {
      console.log('Lang not supported', textHeader);
      return '';
    }
  };

  parseMsg = para => {
    try {
      let mtype = [];
      let mdata = [];
      para.results.msg.map(msg => {
        mtype.push(msg.type);
        mdata.push(msg.data);
      });
      return [mtype, mdata];
    } catch (error) {
      return [[''], ['']];
    }
  };

  parseTxt = para => {
    if ('text' in para) {
      return para.text;
    } else {
      return '';
    }
  };

  showParaRunning = index => {
    let parsedPara = this.state.parsedPara;
    this.state.parsedPara.map((_, idx) => {
      if (index === -2) {
        parsedPara[idx].queueBool = true;
        parsedPara[idx].hiddenOutBool = true;
      } else if (index === -1) {
        parsedPara[idx].runningBool = true;
        parsedPara[idx].hiddenOutBool = true;
      } else if (index === idx) {
        parsedPara[idx].runningBool = true;
        parsedPara[idx].hiddenOutBool = true;
      }
    });
    this.setState({ parsedPara });
  };

  parsePara = () => {
    let parsedPara = [];
    try {
      this.state.paragraphs.map((para, index) => {
        let tempPara = {
          zepId: para.id,
          runningBool: false,
          queueBool: false,
          hoverBool: false,
          selectBool: false,
          hiddenInpBool: false,
          hiddenOutBool: false,
          addParaBool: false,
          id: index + 1,
          inp: this.parseTxt(para),
          lang:
            'text/x-' +
            this.parseLang(
              this.parseTxt(para)
                .split('\n')[0]
                .split('.')[0]
            ),
          editLang: this.parseLang(
            this.parseTxt(para)
              .split('\n')[0]
              .split('.')[0]
          ),
          typeOut: this.parseMsg(para)[0],
          out: this.parseMsg(para)[1],
        };
        parsedPara.push(tempPara);
      });
      this.setState({ parsedPara });
      console.log('Parsing para:', parsedPara);
    } catch (error) {
      console.log('Parsing para has some issue', error);
      this.setState({ parsedPara: [] });
    }
  };

  cellSelector = index => {
    let parsedPara = this.state.parsedPara;
    this.state.parsedPara.map((_, idx) => {
      if (index === idx) parsedPara[idx].selectBool = true;
      else parsedPara[idx].selectBool = false;
    });
    this.setState({ parsedPara });
  };

  addParaHover = para => {
    console.log('add para hover');
    para.addParaBool = !para.addParaBool;
  };

  cellHoverReset = () => {
    let parsedPara = this.state.parsedPara;
    this.state.parsedPara.map((_, index) => {
      parsedPara[index].hoverBool = false;
    });
    this.setState({ parsedPara });
  };

  cellHover = para => {
    this.cellHoverReset();
    if (!para.selectBool) para.hoverBool = true;
  };

  textValueEditor = (evt, index) => {
    if (!(evt.key === 'Enter' && evt.shiftKey)) {
      let parsedPara = this.state.parsedPara;
      parsedPara[index].inp = evt.target.value;
      this.setState({ parsedPara });
    }
  };

  deleteGetParagraph = async para => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'reporting' },
      body: JSON.stringify({
        noteid: this.props.noteId,
        paraid: para.zepId,
      }),
    };
    const response = await fetch('../push/deletepara/', requestOptions);
    const body = response.json();
    return body;
  };

  deletePara = () => {
    let delPara = [];

    let parsedPara = this.state.parsedPara;
    this.state.parsedPara.map(para => {
      if (para.selectBool === true) {
        delPara = para;
      }
    });

    this.setState({ parsedPara });

    console.log('we want to delete para');
    this.deleteGetParagraph(delPara)
      .then(res => {
        console.log('para del', res);
        this.setState({ paragraphs: res.paragraphs });
        this.parsePara();
      })
      .catch(err => console.log('update para:', err));
  };

  addGetParagraph = async index => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'reporting' },
      body: JSON.stringify({
        noteid: this.props.noteId,
        paraindex: index,
        parainp: '%elasticsearch\n',
      }),
    };
    const response = await fetch('../push/addpara/', requestOptions);
    const body = response.json();
    return body;
  };

  addPara = index => {
    console.log('we want to add para');
    // this.showParaRunning(index);
    let paragraphs = this.state.paragraphs;
    // const index = paragraphs.length;
    this.addGetParagraph(index)
      .then(res => {
        paragraphs.splice(index, 0, res);
        this.setState({ paragraphs });
        this.parsePara();
      })
      .catch(err => console.log('update para:', err));
  };

  uprunParagraph = async para => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'reporting' },
      body: JSON.stringify({
        noteid: this.props.noteId,
        paraid: para.zepId,
        parainp: para.inp,
      }),
    };
    const response = await fetch('../push/uprunpara/', requestOptions);
    const body = response.json();
    return body;
  };

  handleKeyPress = (evt, para, index) => {
    if (evt.key === 'Enter' && evt.shiftKey) {
      this.showParaRunning(index);
      let paragraphs = this.state.paragraphs;
      this.uprunParagraph(para, index)
        .then(res => {
          paragraphs[index] = res;
          this.setState({ paragraphs });
          this.parsePara();
        })
        .catch(err => console.log('update para:', err));
    }
  };

  runNotebook = () => {
    let parsedPara = this.state.parsedPara;
    console.log('paras', parsedPara);
  };

  hideOutputs = e => {
    this.setState({ toggleOutput: e.target.checked });
    let parsedPara = this.state.parsedPara;
    this.state.parsedPara.map(
      (para, index) => (parsedPara[index].hiddenOutBool = !para.hiddenOutBool)
    );
    this.setState({ parsedPara });
  };

  hideInputs = e => {
    this.setState({ toggleInput: e.target.checked });
    let parsedPara = this.state.parsedPara;
    this.state.parsedPara.map(
      (para, index) => (parsedPara[index].hiddenInpBool = !para.hiddenInpBool)
    );
    this.setState({ parsedPara });
  };

  fetchNotebook = async () => {
    const noteid = this.props.noteId;
    console.log('fetch', noteid);
    const response = await fetch('../get/noteinfo/' + noteid);
    const body = response.json();
    return body;
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.props.noteId !== prevProps.noteId) {
      this.showParaRunning(-1);
      console.log('compupdate', prevProps);
      this.fetchNotebook()
        .then(res => this.setState(res, this.parsePara))
        .catch(err => console.log('fd:', err));
    }
  }

  render() {
    return (
      <div>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle>
              <h2>
                {' '}
                <EuiIcon type="notebookApp" size="l" style={{ marginRight: '0.5vw' }} />
                {this.props.noteName}
              </h2>
            </EuiTitle>
          </EuiPageContentHeaderSection>
          <ParaButtons
            toggleInput={this.state.toggleInput}
            toggleOutput={this.state.toggleOutput}
            hideInputs={this.hideInputs}
            hideOutputs={this.hideOutputs}
            deletePara={this.deletePara}
          />
        </EuiPageContentHeader>
        <EuiPageContentBody>
          <Cells>
            {this.state.parsedPara.map((para, index) => (
              <Paragraphs
                para={para}
                index={index}
                cellSelector={this.cellSelector}
                cellHover={this.cellHover}
                cellHoverReset={this.cellHoverReset}
                textValueEditor={this.textValueEditor}
                handleKeyPress={this.handleKeyPress}
                addParaHover={this.addParaHover}
                addPara={this.addPara}
              />
            ))}
          </Cells>
        </EuiPageContentBody>
      </div>
    );
  }
}

export default NBCell;

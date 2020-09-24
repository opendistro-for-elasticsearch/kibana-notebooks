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

import React, { useState } from 'react';
import { Input, Prompt, Source } from '@nteract/presentational-components';

import { ParaType } from '../../../common';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSuperDatePicker,
  EuiTextArea,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiButton,
  EuiButtonEmpty,
  EuiInMemoryTable,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiHorizontalRule,
  EuiLink,
} from '@elastic/eui';

/*
 * "ParaInput" component is used by notebook to populate paragraph inputs for an open notebook.
 *
 * Props taken in as params are:
 * para - parsed paragraph from notebook
 * index - index of paragraph in the notebook
 * textValueEditor - function for handling input in textarea
 * handleKeyPress - function for handling key press like "Shift-key+Enter" to run paragraph
 *
 * Input component of nteract used as a container for notebook UI.
 * https://components.nteract.io/#input
 */

export const ParaInput = (props: {
  para: ParaType;
  index: number;
  runParaError: boolean;
  textValueEditor: (evt: React.ChangeEvent<HTMLTextAreaElement>, index: number) => void;
  handleKeyPress: (evt: React.KeyboardEvent<Element>, para: any, index: number) => void;
  startTime: string;
  setStartTime: (startTime: string) => void;
  endTime: string;
  setEndTime: (endTime: string) => void;
  setIsOutputStale: (isStale?: boolean) => void;
  visOptions: EuiComboBoxOptionOption[];
  selectedVisOption: EuiComboBoxOptionOption[];
  setSelectedVisOption: (newOption: EuiComboBoxOptionOption[]) => void;
}) => {
  const { para, index, runParaError, textValueEditor, handleKeyPress } = props;

  const renderParaInput = () => {
    return (
      <Source language={para.lang}>
        {/* If the para is selected show the editor else display the code in the paragraph */}
        {para.isSelected ? (
          <EuiTextArea
            className="editorArea"
            fullWidth
            isInvalid={runParaError}
            onChange={(evt) => {
              textValueEditor(evt, index);
              props.setIsOutputStale(true);
            }}
            onKeyPress={(evt) => handleKeyPress(evt, para, index)}
            value={para.inp}
            autoFocus
          />
        ) : (
            para.inp
          )}
      </Source>
    );
  };

  const renderVisInput = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const columns = [
      {
        field: 'label',
        name: 'Title',
        truncateText: true,
        render: (item) => <EuiLink>{item}</EuiLink>
      }
    ];
    return (
      <>
        <EuiFlexGroup alignItems="flexEnd" gutterSize="s">
          <EuiFlexItem grow={6}>
            <EuiFormRow label="Title" fullWidth>
              <EuiComboBox
                placeholder="Find Kibana visualization"
                singleSelection={{ asPlainText: true }}
                options={props.visOptions}
                selectedOptions={props.selectedVisOption}
                onChange={(newOption: EuiComboBoxOptionOption[]) => {
                  props.setSelectedVisOption(newOption);
                  props.setIsOutputStale(true);
                }}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton iconSide="right" iconType="folderOpen" onClick={() => setIsModalOpen(true)}>
              Browse
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={2} />
          <EuiFlexItem grow={9}>
            <EuiFormRow label="Date range" fullWidth>
              <EuiSuperDatePicker
                start={props.startTime}
                end={props.endTime}
                showUpdateButton={false}
                onTimeChange={(e) => {
                  props.setStartTime(e.start);
                  props.setEndTime(e.end);
                  props.setIsOutputStale(true);
                }}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem />
        </EuiFlexGroup>

        {isModalOpen &&
          <EuiOverlayMask>
            <EuiModal onClose={() => setIsModalOpen(false)}>
              <EuiModalHeader>
                <EuiModalHeaderTitle>Browse Kibana visualizations</EuiModalHeaderTitle>
              </EuiModalHeader>

              <EuiModalBody>
                <EuiInMemoryTable
                  items={props.visOptions}
                  columns={columns}
                  search={{
                    box: {
                      incremental: true,
                      schema: true,
                    }
                  }}
                  pagination={{
                    initialPageSize: 10,
                    pageSizeOptions: [5, 10, 15],
                  }}
                />
              </EuiModalBody>

              <EuiModalFooter>
                <EuiButtonEmpty onClick={() => setIsModalOpen(false)}>Cancel</EuiButtonEmpty>
                <EuiButton onClick={() => {
                  props.setIsOutputStale(true);
                  setIsModalOpen(false);
                }} fill>Select</EuiButton>
              </EuiModalFooter>
            </EuiModal>
          </EuiOverlayMask>
        }
      </>
    );
  };

  return (
    <Input hidden={para.isInputHidden}>
      <Prompt blank={true} running={para.isRunning} queued={para.inQueue} />
      {para.isVizualisation ? renderVisInput() : renderParaInput()}
    </Input>
  );
};

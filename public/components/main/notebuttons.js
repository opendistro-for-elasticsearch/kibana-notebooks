import React, { Component } from 'react';
import { EuiPageHeaderSection, EuiButtonIcon } from '@elastic/eui';

class NoteButtons extends Component {
  state = {
    newNoteName: 'None',
  };

  handleClick = event => {
    const newNoteName = prompt('Please enter new Notebook Name');
    this.setState({ newNoteName });
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.state.newNoteName !== prevState.newNoteName) {
      this.props.newNotebook(this.state.newNoteName);
    }
  }

  render() {
    return (
      <EuiPageHeaderSection>
        <EuiButtonIcon
          color="primary"
          key="Hi"
          onClick={event => this.handleClick(event)}
          iconType="indexOpen"
          iconSize="l"
          aria-label="New Note"
          //   disabled={color === 'disabled' ? true : false}
        />
      </EuiPageHeaderSection>
    );
  }
}

export default NoteButtons;

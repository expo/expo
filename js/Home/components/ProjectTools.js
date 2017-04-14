import React from 'react';
import { AppState, Clipboard, View } from 'react-native';

import QRCodeButton from './QRCodeButton';
import OpenFromClipboardButton from './OpenFromClipboardButton';

const CLIPBOARD_POLL_INTERVAL = 2000;

function clipboardMightBeOpenable(str) {
  if (!str) {
    return;
  }

  // @username/experience
  if (str.match(/@\w+\/\w+/)) {
    return true;
  } else if (str.includes('exp://')) {
    return true;
  }

  return false;
}

export default class ProjectTools extends React.Component {
  state = {
    clipboardContents: '',
    displayOpenClipboardButton: false,
  };

  componentWillMount() {
    this._fetchClipboardContentsAsync();
  }

  componentDidMount() {
    this._startPollingClipboard();
  }

  componentWillReceiveProps(nextProps) {
    this._maybeUpdatePollingState(nextProps);
  }

  componentWillUnmount() {
    this._stopPollingClipboard();
  }

  render() {
    let { clipboardContents, displayOpenClipboardButton } = this.state;

    return (
      <View style={{ marginBottom: 15 }}>
        <QRCodeButton fullWidthBorder={!displayOpenClipboardButton} />
        {displayOpenClipboardButton &&
          <OpenFromClipboardButton
            clipboardContents={clipboardContents}
            fullWidthBorder
          />}
      </View>
    );
  }

  _fetchClipboardContentsAsync = async () => {
    let clipboardContents = await Clipboard.getString();

    if (clipboardContents !== this.state.clipboardContents) {
      requestIdleCallback(() => {
        this.setState({
          clipboardContents,
          displayOpenClipboardButton: clipboardMightBeOpenable(
            clipboardContents
          ),
        });
      });
    }
  };

  _maybeResumePollingFromAppState = nextAppState => {
    if (nextAppState === 'active') {
      this._startPollingClipboard();
    } else {
      this._stopPollingClipboard();
    }
  };

  _maybeUpdatePollingState = props => {
    if (props.pollForUpdates && !this._clipboardUpdateInterval) {
      this._startPollingClipboard();
    } else {
      if (!props.pollForUpdates && this._clipboardUpdateInterval) {
        this._stopPollingClipboard();
      }
    }
  };

  _startPollingClipboard = () => {
    this._clipboardUpdateInterval = setInterval(
      this._fetchClipboardContentsAsync,
      CLIPBOARD_POLL_INTERVAL
    );

    AppState.addEventListener('change', this._maybeResumePollingFromAppState);
  };

  _stopPollingClipboard = () => {
    clearInterval(this._clipboardUpdateInterval);
    this._clipboardUpdateInterval = null;
    AppState.removeEventListener(
      'change',
      this._maybeResumePollingFromAppState
    );
  };
}

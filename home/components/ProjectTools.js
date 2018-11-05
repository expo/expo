/**
 * @flow
 */

import React from 'react';
import { AppState, Clipboard, Platform, View } from 'react-native';
import { Constants } from 'expo';

import QRCodeButton from './QRCodeButton';
import OpenFromClipboardButton from './OpenFromClipboardButton';

const CLIPBOARD_POLL_INTERVAL = 2000;

function clipboardMightBeOpenable(str: string): boolean {
  if (!str) {
    return false;
  }

  // @username/experience
  if (str.match(/^@\w+\/\w+/)) {
    return true;
  } else if (str.match(/^exp:\/\//)) {
    return true;
  }

  return false;
}

type Props = {
  pollForUpdates: boolean,
};

type State = {
  clipboardContents: string,
  displayOpenClipboardButton: boolean,
};

export default class ProjectTools extends React.Component {
  props: Props;
  state: State = {
    clipboardContents: '',
    displayOpenClipboardButton: false,
  };

  _clipboardUpdateInterval: ?number = null;

  componentWillMount() {
    this._fetchClipboardContentsAsync();
  }

  componentDidMount() {
    this._startPollingClipboard();
    AppState.addEventListener('change', this._maybeResumePollingFromAppState);
  }

  componentWillReceiveProps(nextProps: Props) {
    this._maybeUpdatePollingState(nextProps);
  }

  componentWillUnmount() {
    this._stopPollingClipboard();

    AppState.removeEventListener('change', this._maybeResumePollingFromAppState);
  }

  render() {
    let { clipboardContents, displayOpenClipboardButton } = this.state;

    return (
      <View style={{ marginBottom: 15 }}>
        {Platform.OS === 'android' && Constants.isDevice ? (
          <QRCodeButton fullWidthBorder={!displayOpenClipboardButton} />
        ) : null}
        <OpenFromClipboardButton
          clipboardContents={clipboardContents}
          isValid={displayOpenClipboardButton}
          fullWidthBorder
        />
      </View>
    );
  }

  _fetchClipboardContentsAsync = async (): Promise<void> => {
    let clipboardContents = await Clipboard.getString();

    if (clipboardContents !== this.state.clipboardContents) {
      requestIdleCallback(() => {
        this.setState({
          clipboardContents,
          displayOpenClipboardButton: clipboardMightBeOpenable(clipboardContents),
        });
      });
    }
  };

  _maybeResumePollingFromAppState = (nextAppState: string): void => {
    if (this.props.pollForUpdates) {
      if (nextAppState === 'active') {
        this._startPollingClipboard();
      } else {
        this._stopPollingClipboard();
      }
    }
  };

  _maybeUpdatePollingState = (props: Props): void => {
    if (props.pollForUpdates && !this._clipboardUpdateInterval) {
      this._startPollingClipboard();
    } else {
      if (!props.pollForUpdates && this._clipboardUpdateInterval) {
        this._stopPollingClipboard();
      }
    }
  };

  _startPollingClipboard = (): void => {
    this._clipboardUpdateInterval = setInterval(
      this._fetchClipboardContentsAsync,
      CLIPBOARD_POLL_INTERVAL
    );
  };

  _stopPollingClipboard = (): void => {
    if (this._clipboardUpdateInterval) {
      clearInterval(this._clipboardUpdateInterval);
      this._clipboardUpdateInterval = null;
    }
  };
}

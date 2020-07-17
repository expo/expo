/**
 * @flow
 */
import Constants from 'expo-constants';
import React from 'react';
import { AppState, Clipboard, View } from 'react-native';

import Environment from '../utils/Environment';
import OpenFromClipboardButton from './OpenFromClipboardButton';
import QRCodeButton from './QRCodeButton';
import UrlUtils from '../utils/UrlUtils';

const CLIPBOARD_POLL_INTERVAL = 2000;

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

  componentDidMount() {
    if (this.props.pollForUpdates) {
      this._startPollingClipboard();
      this._fetchClipboardContentsAsync();
    }
    AppState.addEventListener('change', this._maybeResumePollingFromAppState);
  }

  componentDidUpdate(_prevProps: Props) {
    this._maybeUpdatePollingState(this.props);
  }

  componentWillUnmount() {
    this._stopPollingClipboard();

    AppState.removeEventListener('change', this._maybeResumePollingFromAppState);
  }

  render() {
    const { clipboardContents, displayOpenClipboardButton } = this.state;
    const shouldDisplayQRCodeButton = Constants.isDevice && !Environment.IsIOSRestrictedBuild;
    const shouldDisplayClipboardButton = !Constants.isDevice;
    return (
      <View>
        {shouldDisplayQRCodeButton && <QRCodeButton last={!shouldDisplayClipboardButton} />}
        {shouldDisplayClipboardButton && (
          <OpenFromClipboardButton
            clipboardContents={clipboardContents}
            isValid={displayOpenClipboardButton}
          />
        )}
      </View>
    );
  }

  _fetchClipboardContentsAsync = async (): Promise<void> => {
    const clipboardContents = await Clipboard.getString();

    if (clipboardContents !== this.state.clipboardContents) {
      requestAnimationFrame(() => {
        this.setState({
          clipboardContents,
          displayOpenClipboardButton: UrlUtils.conformsToExpoProtocol(clipboardContents),
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

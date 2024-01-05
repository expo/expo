import Constants from 'expo-constants';
import * as React from 'react';
import { Clipboard, Keyboard, Linking, Platform } from 'react-native';

import * as UrlUtils from '../utils/UrlUtils';
import ListItem from './ListItem';

type Props = {
  isValid: boolean;
  clipboardContents: string;
};

let message = 'Project URLs on your clipboard will appear here.';

if (Platform.OS === 'ios') {
  // Polling is disabled on iOS due to the iOS 13 toast.
  if (Constants.isDevice) {
    // Add a message about tapping to open if a valid project URL is in the clipboard.
    message = 'Project URLs on your clipboard can be opened by tapping here.';
  } else {
    // Inform the user how to get clipboard contents in the simulator.
    message = 'Press ⌘+v to move clipboard to simulator. Tap to open.';
  }
}

export default class OpenFromClipboardButton extends React.Component<Props> {
  onPress = async () => {
    let contents = await Clipboard.getString();
    // Maybe trim the string to remove extra whitespace around the URL.
    if (typeof contents === 'string') {
      contents = contents.trim();
    }
    if (UrlUtils.conformsToExpoProtocol(contents)) {
      this.openAppUrl(contents);
    }
  };

  render() {
    const { clipboardContents, isValid } = this.props;

    // Show info for iOS/Android simulator about how to make clipboard contents available
    if (!isValid) {
      return (
        <ListItem
          onPress={this.onPress}
          subtitle={message}
          style={{ paddingVertical: 15, paddingHorizontal: 15 }}
          last
        />
      );
    } else {
      return (
        <ListItem
          icon="md-clipboard"
          title="Open from Clipboard"
          subtitle={clipboardContents}
          onPress={this.handlePressAsync}
          style={{ paddingVertical: 15 }}
          last
        />
      );
    }
  }

  private handlePressAsync = async () => {
    this.openAppUrl(this.props.clipboardContents);
  };

  private openAppUrl(clipboardUrl: string) {
    // note(brentvatne): navigation should do this automatically
    Keyboard.dismiss();

    const url = UrlUtils.normalizeUrl(clipboardUrl);
    Linking.openURL(url);
  }
}

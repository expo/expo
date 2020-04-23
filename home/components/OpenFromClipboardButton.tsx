import * as React from 'react';
import { Keyboard, Linking, Platform } from 'react-native';

import UrlUtils from '../utils/UrlUtils';
import ListItem from './ListItem';

type Props = {
  isValid: boolean;
  clipboardContents: string;
};

export default class OpenFromClipboardButton extends React.Component<Props> {
  render() {
    const { clipboardContents, isValid } = this.props;

    // Show info for iOS/Android simulator about how to make clipboard contents available
    if (!isValid) {
      return (
        <ListItem
          subtitle={
            Platform.OS === 'ios'
              ? 'Press ⌘+v to move clipboard to simulator.'
              : 'Project URLs on your clipboard will appear here.'
          }
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
          last
        />
      );
    }
  }

  private handlePressAsync = async () => {
    // note(brentvatne): navigation should do this automatically
    Keyboard.dismiss();

    const url = UrlUtils.normalizeUrl(this.props.clipboardContents);
    Linking.canOpenURL(url) && Linking.openURL(url);
  };
}

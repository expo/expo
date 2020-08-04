import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

const icon = (name: string) => <MaterialCommunityIcons key={name} name={name} size={24} />;

interface Props {
  title: string;
  showActionSheetWithOptions: (options: object, onSelection: (index: number) => void) => void;
  onSelection: (index: number) => void;
  withTitle?: boolean;
  withMessage?: boolean;
  withIcons?: boolean;
  withSeparators?: boolean;
  withCustomStyles?: boolean;
}

// A custom button that shows examples of different share sheet configurations
export default class ShowActionSheetButton extends React.PureComponent<Props> {
  static defaultProps = {
    withTitle: false,
    withMessage: false,
    withIcons: false,
    withSeparators: false,
    withCustomStyles: false,
    onSelection: null,
  };

  _showActionSheet = () => {
    const {
      withTitle,
      withMessage,
      withIcons,
      withSeparators,
      withCustomStyles,
      onSelection,
      showActionSheetWithOptions,
    } = this.props;
    // Same interface as https://facebook.github.io/react-native/docs/actionsheetios.html
    const options = ['Delete', 'Save', 'Share', 'Cancel'];
    const icons = withIcons
      ? [icon('delete'), icon('content-save'), icon('share'), icon('cancel')]
      : null;
    const title = withTitle ? 'Choose An Action' : null;
    const message = withMessage
      ? 'This library tries to mimic the native share sheets as close as possible.'
      : null;
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 3;
    const textStyle = withCustomStyles ? { fontSize: 20, fontWeight: '500', color: 'blue' } : null;
    const titleTextStyle = withCustomStyles
      ? {
          fontSize: 24,
          textAlign: 'center',
          fontWeight: '700',
          color: 'orange',
        }
      : null;
    const messageTextStyle = withCustomStyles
      ? { fontSize: 12, color: 'purple', textAlign: 'right' }
      : null;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title,
        message,
        icons, // Android only
        tintIcons: true, // Android only; default is true
        showSeparators: withSeparators, // Affects Android only; default is false
        textStyle, // Android only
        titleTextStyle, // Android only
        messageTextStyle, // Android only
      },
      buttonIndex => {
        // Do something here depending on the button index selected
        onSelection(buttonIndex);
      }
    );
  };

  render() {
    const { title } = this.props;
    return (
      <View style={{ margin: 6 }}>
        <MaterialCommunityIcons.Button
          name="code-tags"
          backgroundColor="#3e3e3e"
          onPress={this._showActionSheet}>
          <Text
            style={{
              fontSize: 15,
              color: '#fff',
            }}>
            {title}
          </Text>
        </MaterialCommunityIcons.Button>
      </View>
    );
  }
}

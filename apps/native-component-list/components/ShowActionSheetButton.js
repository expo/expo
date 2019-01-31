import React from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';
import { MaterialIcons, Entypo } from '@expo/vector-icons';

const icon = (name) => <MaterialIcons key={name} name={name} size={24} />;

// A custom button that shows examples of different share sheet configurations
class ShowActionSheetButton extends React.PureComponent {
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
    const icons = withIcons ? [icon('delete'), icon('save'), icon('share'), icon('cancel')] : null;
    const title = withTitle ? 'Choose An Action' : null;
    const message = withMessage ? 'This library tries to mimic the native share sheets as close as possible.' : null;
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 3;
    const textStyle = withCustomStyles ? { fontSize: 20, fontWeight: '500', color: 'blue' } : null;
    const titleTextStyle = withCustomStyles ? { fontSize: 24, textAlign: 'center', fontWeight: '700', color: 'orange' } : null;
    const messageTextStyle = withCustomStyles ? { fontSize: 12, color: 'purple', textAlign: 'right' } : null;

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
        <Entypo.Button
          name="code"
          backgroundColor="#3e3e3e"
          onPress={this._showActionSheet}>
          <Text style={{
            fontSize: 15,
            color: '#fff'
          }}>{title}</Text>
        </Entypo.Button>
      </View>
    );
  }
}

ShowActionSheetButton.propTypes = {
  title: PropTypes.string.isRequired,
  onSelection: PropTypes.func,
  showActionSheetWithOptions: PropTypes.func.isRequired,
  withTitle: PropTypes.bool,
  withMessage: PropTypes.bool,
  withIcons: PropTypes.bool,
  withSeparators: PropTypes.bool,
  withCustomStyles: PropTypes.bool,
};

ShowActionSheetButton.defaultProps = {
  withTitle: false,
  withMessage: false,
  withIcons: false,
  withSeparators: false,
  withCustomStyles: false,
  onSelection: null,
};

export default ShowActionSheetButton;

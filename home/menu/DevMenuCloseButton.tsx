import React from 'react';
import {
  Platform,
  StyleSheet,
  TouchableHighlight as TouchableHighlightRN,
  View,
} from 'react-native';
import { ThemeContext } from 'react-navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableHighlight as TouchableHighlightGH } from 'react-native-gesture-handler';

type Props = {
  style: any;
  onPress: () => void;
};

// When rendered inside bottom sheet, touchables from RN don't work on Android, but the ones from GH don't work on iOS.
const TouchableHighlight = Platform.OS === 'android' ? TouchableHighlightGH : TouchableHighlightRN;

const HIT_SLOP = { top: 15, bottom: 15, left: 15, right: 15 };

class DevMenuCloseButton extends React.PureComponent<Props, any> {
  static contextType = ThemeContext;

  onPress = () => {
    if (this.props.onPress) {
      this.props.onPress();
    }
  };

  render() {
    return (
      <View style={this.props.style}>
        <TouchableHighlight
          style={styles.closeButton}
          onPress={this.onPress}
          underlayColor={this.context === 'light' ? '#eee' : '#333'}
          hitSlop={HIT_SLOP}>
          <MaterialCommunityIcons
            name="close"
            size={20}
            color="#2F9BE4"
            style={styles.closeButtonIcon}
          />
        </TouchableHighlight>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 2,
  },
  closeButtonIcon: {
    width: 20,
    height: 20,
  },
});

export default DevMenuCloseButton;

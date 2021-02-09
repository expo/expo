import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import {
  Platform,
  StyleSheet,
  TouchableHighlight as TouchableHighlightRN,
  View,
} from 'react-native';
import { TouchableHighlight as TouchableHighlightGH } from 'react-native-gesture-handler';

type Props = {
  style: any;
  onPress: () => void;
};

// When rendered inside bottom sheet, touchables from RN don't work on Android, but the ones from GH don't work on iOS.
const TouchableHighlight = Platform.OS === 'android' ? TouchableHighlightGH : TouchableHighlightRN;

const HIT_SLOP = { top: 15, bottom: 15, left: 15, right: 15 };

function DevMenuCloseButton(props: Props) {
  const onPress = () => {
    if (props.onPress) {
      props.onPress();
    }
  };

  const theme = useTheme();

  return (
    <View style={props.style}>
      <TouchableHighlight
        style={styles.closeButton}
        onPress={onPress}
        underlayColor={theme.dark ? '#333' : '#eee'}
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

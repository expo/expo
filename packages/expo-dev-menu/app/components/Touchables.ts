import {
  Platform,
  TouchableOpacity as TouchableOpacityRN,
  TouchableHighlight as TouchableHighlightRN,
} from 'react-native';
import {
  TouchableOpacity as TouchableOpacityGH,
  TouchableHighlight as TouchableHighlightGH,
} from 'react-native-gesture-handler';

// When rendered inside bottom sheet, touchables from RN don't work on Android, but the ones from GH don't work on iOS.
const TouchableOpacity = Platform.OS === 'android' ? TouchableOpacityGH : TouchableOpacityRN;
const TouchableHighlight = Platform.OS === 'android' ? TouchableHighlightGH : TouchableHighlightRN;

export { TouchableOpacity, TouchableHighlight };

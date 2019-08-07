// We make some of the Expo SDK available on a global in order to make it
// possible to augment their libraries with some Expo-specific behavior
// when inside of an environment with the Expo SDK present, but otherwise
// continue to work in any bare React Native app without requiring that
// they install the 'expo' package. We can get rid of this entirely when
// the following RFC has been implemented:
// https://github.com/react-native-community/discussions-and-proposals/issues/120
import Constants from 'expo-constants';
import * as Font from 'expo-font';
import * as Icon from '@expo/vector-icons';
export { Asset } from 'expo-asset';
export { Constants };
export { Font };
export { Icon };
export { LinearGradient } from 'expo-linear-gradient';
export { SQLite } from 'expo-sqlite';
//# sourceMappingURL=globals.web.js.map
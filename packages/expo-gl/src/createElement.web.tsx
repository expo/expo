// Due to https://github.com/necolas/react-native-web/blob/5287044f403d881a13e17f140c5575ce0661587f/packages/react-native-web/src/index.js#L1
// See https://github.com/react-native-community/react-native-svg/blob/develop/src/ReactNativeSVG.web.ts

import {
  // @ts-ignore
  unstable_createElement as ucE,
  // @ts-ignore
  createElement as cE,
} from 'react-native';

export const createElement = cE || ucE;

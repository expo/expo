import * as React from 'react';

import ExpoAPIIcon from '../components/ExpoAPIIcon';
import { Screens } from '../navigation/ExpoComponents';
import ComponentListScreen from './ComponentListScreen';

const screens = [
  'ActivityIndicator',
  'AdMob',
  'BarCodeScanner',
  'BlurView',
  'Button',
  'Camera',
  'CheckBox',
  'DateTimePicker',
  'DrawerLayoutAndroid',
  'FacebookAds',
  'GL',
  'GestureHandlerList',
  'GestureHandlerPinch',
  'GestureHandlerSwipeable',
  'Gif',
  'HTML',
  'Image',
  'LinearGradient',
  'Lottie',
  'Maps',
  'MaskedView',
  'Modal',
  'Picker',
  'Pressable',
  'ProgressBarAndroid',
  'ProgressViewIOS',
  'QRCode',
  'ReanimatedImagePreview',
  'ReanimatedProgress',
  'SVG',
  'Screens',
  'ScrollView',
  'SegmentedControl',
  'SharedElement',
  'Slider',
  'Switch',
  'Text',
  'TextInput',
  'TouchableBounce',
  'Touchables',
  'Video',
  'ViewPager',
  'WebView',
];

export default function ExpoComponentsScreen() {
  const apis = React.useMemo(() => {
    return screens
      .map(name => ({
        name,
        route: `/components/${name.toLowerCase()}`,
        isAvailable: !!Screens[name],
      }))
      .sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          if (a.isAvailable) {
            return -1;
          }
          return 1;
        }
        return 0;
      });
  }, []);

  const renderItemRight = React.useCallback(
    ({ name }) => <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />,
    []
  );

  return <ComponentListScreen renderItemRight={renderItemRight} apis={apis} />;
}

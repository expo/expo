import * as React from 'react';

import ExpoAPIIcon from '../components/ExpoAPIIcon';
import { Screens } from '../navigation/ExpoComponents';
import ComponentListScreen from './ComponentListScreen';

const screens = [
  'AdMob',
  'BarCodeScanner',
  'BlurView',
  'Camera',
  'QRCode',
  'DateTimePicker',
  'FacebookAds',
  'GestureHandlerList',
  'GestureHandlerPinch',
  'GestureHandlerSwipeable',
  'Gif',
  'GL',
  'HTML',
  'Image',
  'LinearGradient',
  'Lottie',
  'Maps',
  'MaskedView',
  'ReanimatedImagePreview',
  'ReanimatedProgress',
  'SegmentedControl',
  'Screens',
  'SharedElement',
  'SVG',
  'ViewPager',
  'Video',
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

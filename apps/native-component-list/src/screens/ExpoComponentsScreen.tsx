import ComponentListScreen from './ComponentListScreen';
import ExpoAPIIcon from '../components/ExpoAPIIcon';

const screens = [
  'ActivityIndicator',
  'BlurView',
  'Button',
  'Camera',
  'Camera (barcode)',
  'Camera (barcode from URL)',
  'Checkbox',
  'ClipboardPasteButton',
  'DateTimePicker',
  'DrawerLayoutAndroid',
  'ExpoMaps',
  'FlashList',
  'GL',
  'GestureHandlerList',
  'GestureHandlerPinch',
  'GestureHandlerSwipeable',
  'HTML',
  'Image',
  'LinearGradient',
  'LivePhoto',
  'Lottie',
  'Maps',
  'MaskedView',
  'MeshGradient',
  'Modal',
  'Picker',
  'Pressable',
  'Reanimated',
  'Skia',
  'SVG',
  'Screens',
  'ScrollView',
  'SegmentedControl',
  'Slider',
  'Switch',
  'Symbols',
  'Text',
  'TextInput',
  'TouchableBounce',
  'Touchables',
  'Video (expo-av)',
  'Video (expo-video)',
  'PagerView',
  'WebView',
];

export const ScreenItems = screens.map((name) => ({
  name,
  route: `/components/${name.toLowerCase()}`,
  // isAvailable: !!Screens[name],
  isAvailable: true,
}));

export default function ExpoComponentsScreen() {
  return (
    <ComponentListScreen
      renderItemRight={({ name }: { name: string }) => (
        <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />
      )}
      apis={ScreenItems}
    />
  );
}

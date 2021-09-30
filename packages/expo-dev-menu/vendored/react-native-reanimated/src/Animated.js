import { Image, ScrollView, Text, View } from 'react-native';
import createAnimatedComponent from './createAnimatedComponent';
import {
  addWhitelistedNativeProps,
  addWhitelistedUIProps,
} from './ConfigHelper';
import * as reanimated1 from './reanimated1';

const Animated = {
  // components
  View: createAnimatedComponent(View),
  Text: createAnimatedComponent(Text),
  Image: createAnimatedComponent(Image),
  ScrollView: createAnimatedComponent(ScrollView),
  createAnimatedComponent,
  // configuration
  addWhitelistedNativeProps,
  addWhitelistedUIProps,
  // reanimated 1
  ...reanimated1,
};

export * from './reanimated2';
export * from './reanimated1';
export default Animated;

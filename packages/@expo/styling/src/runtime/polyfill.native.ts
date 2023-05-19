import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { defaultCSSInterop } from './native/css-interop';

Object.assign(View, { cssInterop: defaultCSSInterop });
Object.assign(Text, { cssInterop: defaultCSSInterop });
Object.assign(Pressable, { cssInterop: defaultCSSInterop });
Object.assign(Animated.Text, { cssInterop: defaultCSSInterop });
Object.assign(Animated.View, { cssInterop: defaultCSSInterop });

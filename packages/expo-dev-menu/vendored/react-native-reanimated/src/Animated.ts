export { default as createAnimatedComponent } from './createAnimatedComponent';
export {
  addWhitelistedNativeProps,
  addWhitelistedUIProps,
} from './ConfigHelper';

export { default as Text } from './reanimated2/component/Text';
export { default as View } from './reanimated2/component/View';
export { default as ScrollView } from './reanimated2/component/ScrollView';
export { default as Image } from './reanimated2/component/Image';
export { default as FlatList } from './reanimated2/component/FlatList';
// @ts-ignore backward compatibility with treeshaking
export * from './reanimated1';

import type { XCFrameworkSpec } from './types';

export const XCFramework: Record<string, XCFrameworkSpec> = {
  Hermes: {
    path: 'ios/Pods/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework',
    name: 'hermesvm',
    targets: ['hermesvm'],
  },
  React: {
    path: 'ios/Pods/React-Core-prebuilt/React.xcframework',
    name: 'React',
    targets: ['React'],
  },
  ReactDependencies: {
    path: 'ios/Pods/ReactNativeDependencies/framework/packages/react-native/ReactNativeDependencies.xcframework',
    name: 'ReactNativeDependencies',
    targets: ['ReactNativeDependencies'],
  },
};

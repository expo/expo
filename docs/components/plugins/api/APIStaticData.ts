export const nonLinkableTypes = [
  'B',
  'BufferSource',
  'CodedError',
  'ColorValue',
  'ComponentClass',
  'ComponentProps',
  'ComponentType',
  'E',
  'EmitterSubscription',
  'EventName',
  'EventSubscription',
  'ForwardRefExoticComponent',
  'GeneratedHref',
  'GestureResponderEvent',
  'GetPermissionMethod',
  'InferEventParameter',
  'K',
  'Listener',
  'ModuleType',
  'NativeSyntheticEvent',
  'NavigationContainerRefWithCurrent',
  'NotificationTimeoutError',
  'Options',
  'P',
  'Parameters',
  'ParamListBase',
  'ParsedQs',
  'PartialState',
  'PermissionHookBehavior',
  'PropsWithChildren',
  'PropsWithoutRef',
  'ProxyNativeModule',
  'React.FC',
  'RequestPermissionMethod',
  'RouteInputParams',
  'RouteOutputParams',
  'RouteParamInput',
  'RouteParams',
  'RouteSegments',
  'ScreenListeners',
  'ServiceActionResult',
  'StyleProp',
  'T',
  'TaskOptions',
  'TEventListener',
  'TEventMap',
  'TEventName',
  'TEventsMap',
  'TInitialValue',
  'TOptions',
  'TParams',
  'TRoute',
  'TSegments',
  'TState',
  'UnknownInputParams',
  'UnknownOutputParams',
];

/**
 * List of type names that should not be visible in the docs.
 */
export const omittableTypes = [
  // Internal React type that adds `ref` prop to the component
  'RefAttributes',
];

/**
 * Map of internal entity/type names that should be replaced with something more developer-friendly.
 */
export const replaceableTypes: Partial<Record<string, string>> = {
  ForwardRefExoticComponent: 'Component',
  LocationAccuracy: 'Accuracy',
  LocationGeofencingRegionState: 'GeofencingRegionState',
  LocationActivityType: 'ActivityType',
};

/**
 * Map of entity/type names that should be linked to user specified source, internal or external.
 */
export const hardcodedTypeLinks: Record<string, string> = {
  ArrayBuffer:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer',
  Asset: '/versions/latest/sdk/asset/#asset',
  AsyncIterableIterator:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator',
  AVMetadata: '/versions/latest/sdk/av/#avmetadata',
  AVPlaybackSource: '/versions/latest/sdk/av/#avplaybacksource',
  AVPlaybackStatus: '/versions/latest/sdk/av/#avplaybackstatus',
  AVPlaybackStatusToSet: '/versions/latest/sdk/av/#avplaybackstatustoset',
  AudioSampleCallback: '/versions/latest/sdk/av/#avplaybackstatustoset',
  Blob: 'https://developer.mozilla.org/en-US/docs/Web/API/Blob',
  Component: 'https://react.dev/reference/react/Component',
  CreateURLOptions: '/versions/latest/sdk/linking/#createurloptions',
  Date: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',
  DeviceSensor: '/versions/latest/sdk/sensors',
  Element: 'https://www.typescriptlang.org/docs/handbook/jsx.html#function-component',
  Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
  Exclude:
    'https://www.typescriptlang.org/docs/handbook/utility-types.html#excludeuniontype-excludedmembers',
  ExpoConfig:
    'https://github.com/expo/expo/blob/main/packages/%40expo/config-types/src/ExpoConfig.ts',
  Extract: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#extracttype-union',
  // Conflicts with the File class from expo-file-system@next. TODO: Fix this.
  // File: 'https://developer.mozilla.org/en-US/docs/Web/API/File',
  FileList: 'https://developer.mozilla.org/en-US/docs/Web/API/FileList',
  HTMLAnchorElement: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement',
  HTMLInputElement: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement',
  IterableIterator:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator',
  MediaTrackSettings: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings',
  MessageEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent',
  MouseEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent',
  Omit: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys',
  PackagerAsset: 'https://github.com/facebook/react-native/blob/main/packages/assets/registry.js',
  Pick: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys',
  Partial: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype',
  Platform: 'https://reactnative.dev/docs/platform',
  Playback: '/versions/latest/sdk/av/#playback',
  Promise:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  PureComponent: 'https://react.dev/reference/react/PureComponent',
  ReactNode: 'https://reactnative.dev/docs/react-node',
  Readonly: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype',
  Required: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype',
  SFSymbol: 'https://github.com/nandorojo/sf-symbols-typescript',
  ShareOptions: 'https://reactnative.dev/docs/share#share',
  SpeechSynthesisEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisEvent',
  SpeechSynthesisUtterance:
    'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance',
  SyntheticEvent: 'https://react.dev/reference/react-dom/components/common#react-event-object',
  TextProps: 'https://reactnative.dev/docs/text#props',
  Uint8Array:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array',
  View: 'https://reactnative.dev/docs/view',
  ViewProps: 'https://reactnative.dev/docs/view#props',
  ViewStyle: 'https://reactnative.dev/docs/view-style-props',
  WebBrowserOpenOptions: '/versions/latest/sdk/webbrowser/#webbrowseropenoptions',
  WebBrowserWindowFeatures: '/versions/latest/sdk/webbrowser/#webbrowserwindowfeatures',
  WebGL2RenderingContext: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext',
  WebGLFramebuffer: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLFramebuffer',
  WebGLTexture: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture',

  // React Navigation
  DefaultNavigatorOptions:
    'https://reactnavigation.org/docs/custom-navigators/#type-checking-navigators',
  NavigationContainerRef: 'https://reactnavigation.org/docs/navigating-without-navigation-prop',
  NavigationOptions: 'https://reactnavigation.org/docs/screen-options/',
  NavigationState: 'https://reactnavigation.org/docs/navigation-state',
  NavigatorID: 'https://reactnavigation.org/docs/custom-navigators/#type-checking-navigators',
  RouteProp: 'https://reactnavigation.org/docs/glossary-of-terms/#route-object',
  RootParamList: 'https://reactnavigation.org/docs/typescript/#navigator-specific-types',
  TabRouterOptions: 'https://reactnavigation.org/docs/custom-navigators/#type-checking-navigators',
  TabNavigationState:
    'https://reactnavigation.org/docs/custom-navigators/#type-checking-navigators',
};

export const sdkVersionHardcodedTypeLinks: Record<string, Record<string, string | null>> = {
  'v49.0.0': {
    Manifest: '/versions/v49.0.0/sdk/constants/#manifest',
    SharedObject: null,
  },
  'v50.0.0': {
    SharedObject: null,
  },
  '51.0.0': {
    SharedObject: null,
  },
  'v52.0.0': {
    EventEmitter: '/versions/v52.0.0/sdk/expo/#eventemitter',
    NativeModule: '/versions/v52.0.0/sdk/expo/#nativemodule',
    SharedObject: '/versions/v52.0.0/sdk/expo/#sharedobject',
    SharedRef: '/versions/v52.0.0/sdk/expo/#sharedref',
    BufferOptions: '/versions/v52.0.0/sdk/video/#bufferoptions-1',
  },
  'v53.0.0': {
    EventEmitter: '/versions/v53.0.0/sdk/expo/#eventemitter',
    NativeModule: '/versions/v53.0.0/sdk/expo/#nativemodule',
    SharedObject: '/versions/v53.0.0/sdk/expo/#sharedobject',
    SharedRef: '/versions/v53.0.0/sdk/expo/#sharedref',
  },
  latest: {
    EventEmitter: '/versions/latest/sdk/expo/#eventemitter',
    NativeModule: '/versions/latest/sdk/expo/#nativemodule',
    SharedObject: '/versions/latest/sdk/expo/#sharedobject',
    SharedRef: '/versions/latest/sdk/expo/#sharedref',
  },
  unversioned: {
    EventEmitter: '/versions/unversioned/sdk/expo/#eventemitter',
    NativeModule: '/versions/unversioned/sdk/expo/#nativemodule',
    SharedObject: '/versions/unversioned/sdk/expo/#sharedobject',
    SharedRef: '/versions/unversioned/sdk/expo/#sharedref',
    Href: '/versions/unversioned/sdk/router/#href-1',
    BufferOptions: '/versions/unversioned/sdk/video/#bufferoptions-1',
  },
};

export const packageLinks: Record<string, string> = {
  'expo-manifests': 'manifests',
};

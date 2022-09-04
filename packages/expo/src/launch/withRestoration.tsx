import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as React from 'react';
import { Platform } from 'react-native';

import DevLoadingView from '../environment/DevLoadingView';
import { attachRecoveredProps } from './RecoveryProps';

export type InitialProps = {
  exp: {
    notification?: any;
    errorRecovery?: any;
    manifestString?: string;
    [key: string]: any;
  };
  shell?: boolean;
  shellManifestUrl?: string;
  [key: string]: any;
};

const isDevLoadingDisabled =
  !__DEV__ ||
  Platform.OS === 'android' ||
  (Platform.OS === 'ios' && Constants.executionEnvironment === ExecutionEnvironment.Bare);

// This hook can be optionally imported because __DEV__ never changes during runtime.
// Using __DEV__ like this enables tree shaking to remove the hook in production.
let useDevKeepAwake: (tag?: string) => void = () => { };

if (__DEV__ && Platform.OS !== 'web') {
  try {
    // Optionally import expo-keep-awake
    const { useKeepAwake, ExpoKeepAwakeTag } = require('expo-keep-awake');
    useDevKeepAwake = () => useKeepAwake(ExpoKeepAwakeTag, { suppressDeactivateWarnings: true });
  } catch { }
}

export default function withRestoration<P extends InitialProps>(
  AppRootComponent: React.ComponentType<P>
): React.ComponentType<P> {
  function WithRestoration(props: P) {
    useDevKeepAwake();

    const combinedProps = attachRecoveredProps(props);

    if (!isDevLoadingDisabled) {
      return <AppRootComponent {...combinedProps} />;
    }

    // dev-mode only for managed iOS and web.
    return (
      <>
        <AppRootComponent {...combinedProps} />
        <DevLoadingView />
      </>
    );
  }

  if (__DEV__) {
    const name = AppRootComponent.displayName || AppRootComponent.name || 'Anonymous';
    WithRestoration.displayName = `withRestoration(${name})`;
  }

  return WithRestoration;
}

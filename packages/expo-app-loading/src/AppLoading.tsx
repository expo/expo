import React from 'react';

import { _emitEvent } from './LifecycleEmitter';
import * as SplashScreen from './SplashScreen';

export { getAppLoadingLifecycleEmitter } from './LifecycleEmitter';

const AppLoading: React.FC<AppLoadingProps> = props => {
  const startLoadingResources = React.useCallback(async () => {
    if (!props.startAsync) {
      return;
    }

    if (!props.onFinish) {
      throw new Error('AppLoading onFinish prop is required if startAsync is provided');
    }

    try {
      await props.startAsync();
    } catch (error) {
      props.onError!(error);
    } finally {
      props.onFinish();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    _emitEvent('componentDidMount');
    startLoadingResources();
    SplashScreen.preventAutoHideAsync();

    return () => {
      props.autoHideSplash && hideSplashScreen();
      _emitEvent('componentWillUnmount');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

AppLoading.defaultProps = {
  autoHideSplash: true,
  onError: error =>
    console.error(`AppLoading threw an unexpected error when loading:\n${error.stack}`),
};

export default AppLoading;

export type AppLoadingProps = {
  startAsync?: () => Promise<void>;
  onError?: (error: Error) => void;
  onFinish?: () => void;
  autoHideSplash?: boolean;
};

/**
 * Hide the splash screen using a timeout of 200ms.
 * If the environment is running in E2E testing mode, it will execute directly.
 */
function hideSplashScreen() {
  // @ts-ignore
  if (global.__E2E__) {
    SplashScreen.hideAsync();
  } else {
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 200);
  }
}

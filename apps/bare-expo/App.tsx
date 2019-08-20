import React from 'react';

import MainNavigator from './MainNavigator';
import { createProxy, startAsync } from './relapse/client';

// import NativeComponentList from '../native-component-list/App';

// @ts-ignore
const DETOX = (global.DETOX = true);

export default function Main() {
  if (DETOX) {
    React.useEffect(() => {
      const stop = startAsync().then(() => {
        if (DETOX) {
          // @ts-ignore
          global.device = createProxy('device');
          // @ts-ignore
          global.detox = createProxy('detox');
          // global.console = createProxy('console');
          // @ts-ignore
          global.expoRunner = createProxy('expoRunner');
          // @ts-ignore
          global.expoErrorDelegate = createProxy('expoErrorDelegate');
        }
      });

      return () => stop && stop();
    }, []);
  }

  return <MainNavigator uriPrefix="bareexpo://" />;
}

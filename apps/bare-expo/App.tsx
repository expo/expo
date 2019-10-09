import React from 'react';

import MainNavigator from './MainNavigator';
import { createProxy, startAsync, addListener } from './relapse/client';

// import NativeComponentList from '../native-component-list/App';

export default function Main() {
  // @ts-ignore
  if (global.DETOX) {
    React.useEffect(() => {
      addListener(data => {
        if (data.globals) {
          for (const moduleName of data.globals) {
            // @ts-ignore
            global[moduleName] = createProxy(moduleName);
          }
        }
      });

      let stop;
      startAsync().then(_stop => (stop = _stop));

      return () => stop && stop();
    }, []);
  }

  return <MainNavigator uriPrefix="bareexpo://" />;
}

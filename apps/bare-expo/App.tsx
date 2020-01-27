import React from 'react';
import loadNativeComponentListAssetsAsync from 'native-component-list/src/utilities/loadAssetsAsync';

import MainNavigator from './MainNavigator';
import { createProxy, startAsync, addListener } from './relapse/client';

type State = {
  assetsLoaded: boolean;
};

class App extends React.PureComponent<{}, State> {
  state = {
    assetsLoaded: false,
  };

  constructor(props) {
    super(props);
    this.loadAssetsAsync();
  }

  async loadAssetsAsync() {
    try {
      // @tsapeta: Load fonts and assets required by native-component-list.
      // This imho should be moved to the components that require specific assets/fonts.

      await loadNativeComponentListAssetsAsync();
    } catch (e) {
      console.log({ e });
    } finally {
      this.setState({ assetsLoaded: true });
    }
  }

  render() {
    if (!this.state.assetsLoaded) {
      return null;
    }
    return <MainNavigator uriPrefix="bareexpo://" />;
  }
}

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

  return <App />;
}

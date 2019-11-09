import * as React from 'react';
import { AppRegistry, Platform } from 'react-native';

import withExpoRoot from './withExpoRoot';
import DevLoadingView from '../environment/DevLoadingView';
import { InitialProps } from './withExpoRoot.types';

class ExpoDevAppContainer extends React.Component {
  render() {
    return (
      <>
        {this.props.children}
        <DevLoadingView />
      </>
    );
  }
}

export default function registerRootComponent<P extends InitialProps>(
component: React.ComponentType<P>
): void {
if (__DEV__ && Platform.OS === 'ios') {
  // @ts-ignore
  AppRegistry.setWrapperComponentProvider(() => ExpoDevAppContainer);
}

AppRegistry.registerComponent('main', () => withExpoRoot(component));
}

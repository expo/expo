import { Font } from 'expo-font';
import * as React from 'react';
import { AppRegistry, StyleSheet } from 'react-native';

import Notifications from '../Notifications';
import RootErrorBoundary from './RootErrorBoundary';

type InitialProps = {
  exp: {
    notification?: any;
    errorRecovery?: any;
    [key: string]: any;
  };
  shell?: boolean;
  shellManifestUrl?: string;
  [key: string]: any;
};

function wrapWithExpoRoot<P extends InitialProps>(
  AppRootComponent: React.ComponentClass<P>
): React.ComponentClass<P> {
  return class ExpoRootComponent extends React.Component<P> {
    componentWillMount() {
      StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);

      if (this.props.exp.notification) {
        Notifications._setInitialNotification(this.props.exp.notification);
      }
    }

    render() {
      if (__DEV__) {
        return (
          <RootErrorBoundary>
            <AppRootComponent {...this.props} />
          </RootErrorBoundary>
        );
      } else {
        return <AppRootComponent {...this.props} />;
      }
    }
  };
}

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentClass<P>
): void {
  AppRegistry.registerComponent('main', () => wrapWithExpoRoot(component));
}

import * as Font from 'expo-font';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import Notifications from '../Notifications/Notifications';
import RootErrorBoundary from './RootErrorBoundary';

export type InitialProps = {
  exp: {
    notification?: any;
    errorRecovery?: any;
    [key: string]: any;
  };
  shell?: boolean;
  shellManifestUrl?: string;
  [key: string]: any;
};

export default function withExpoRoot<P extends InitialProps>(
  AppRootComponent: React.ComponentClass<P>
): React.ComponentClass<P> {
  return class ExpoRootComponent extends React.Component<P> {
    componentWillMount() {
      // TODO: Bacon: add this to RNWeb?
      if (StyleSheet.setStyleAttributePreprocessor) {
        StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
      }

      // TODO: Bacon: Pass this in for web
      const { exp } = this.props;
      if (exp.notification) {
        Notifications._setInitialNotification(exp.notification);
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

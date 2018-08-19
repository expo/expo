// @flow

import React, { type ComponentType } from 'react';
import { AppRegistry, StyleSheet } from 'react-native';

import { processFontFamily } from '../Font';
import Notifications from '../Notifications';
import RootErrorBoundary from './RootErrorBoundary';

type InitialProps = {
  exp: {
    notification?: Object,
    errorRecovery?: Object,
    [string]: any,
  },
  shell?: boolean,
  shellManifestUrl?: string,
  [string]: any,
};

function wrapWithExpoRoot<P: InitialProps>(AppRootComponent: ComponentType<P>): ComponentType<P> {
  return class ExpoRootComponent extends React.Component<P> {
    componentWillMount() {
      StyleSheet.setStyleAttributePreprocessor('fontFamily', processFontFamily);

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

export default function registerRootComponent(component: ComponentType<*>): void {
  AppRegistry.registerComponent('main', () => wrapWithExpoRoot(component));
}

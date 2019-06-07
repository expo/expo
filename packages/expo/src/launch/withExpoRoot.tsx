import * as Font from 'expo-font';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import RootErrorBoundary from './RootErrorBoundary';
import { InitialProps } from './withExpoRoot.types';

export default function withExpoRoot<P extends InitialProps>(
  AppRootComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return class ExpoRootComponent extends React.Component<P> {
    componentWillMount() {
      if (StyleSheet.setStyleAttributePreprocessor) {
        StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
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

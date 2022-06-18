import * as React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import hoistNonReactStatics from 'hoist-non-react-statics';
import GestureHandlerRootView from './GestureHandlerRootView';

export default function gestureHandlerRootHOC<P>(
  Component: React.ComponentType<P>,
  containerStyles?: StyleProp<ViewStyle>
): React.ComponentType<P> {
  function Wrapper(props: P) {
    return (
      <GestureHandlerRootView style={[styles.container, containerStyles]}>
        <Component {...props} />
      </GestureHandlerRootView>
    );
  }

  Wrapper.displayName = `gestureHandlerRootHOC(${
    Component.displayName || Component.name
  })`;

  hoistNonReactStatics(Wrapper, Component);

  return Wrapper;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

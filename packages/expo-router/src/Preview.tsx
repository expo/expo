'use client';

import { createContext } from 'react';
import { Pressable, StyleSheet, Modal, ModalProps, View } from 'react-native';

import { RouteNode } from './Route';
import { store } from './global-state/router-store';
import { Href, UnknownOutputParams } from './types';
import { getQualifiedRouteComponent } from './useScreens';

export const PreviewParamsContext = createContext<UnknownOutputParams | undefined>(undefined);

export function Preview({ href, ...props }: ModalProps & { href: Href }) {
  let state = store.getStateForHref(href);
  let routeNode: RouteNode | undefined | null = store.routeNode;

  const params = {};

  while (state && routeNode) {
    const route = state.routes[state.index || state.routes.length - 1];
    Object.assign(params, route.params);
    state = route.state;
    routeNode = routeNode.children.find((child) => child.route === route.name);
  }

  if (!routeNode) {
    return null;
  }

  const Component = getQualifiedRouteComponent(routeNode);

  return (
    <PreviewParamsContext.Provider value={params}>
      <Modal transparent {...props}>
        <Pressable style={styles.outer} onPress={props.onDismiss}>
          <View style={styles.inner}>
            <Component />
          </View>
        </Pressable>
      </Modal>
    </PreviewParamsContext.Provider>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    height: '100%',
  },
  inner: {
    backgroundColor: 'white',
    height: '50%',
    width: '50%',
    margin: 'auto',
    pointerEvents: 'none',
  },
});

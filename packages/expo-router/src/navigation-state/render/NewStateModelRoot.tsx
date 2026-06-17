'use client';
// R-Phase C — the app root under the new state model (Decisions R-4/R-5). Mounts the store provider
// with the hydrated app tree, renders the app's root layout component (which renders the new <Stack/>
// reading its slice), and subscribes Android hardware-back to the render-free resolver (seam #7).

import { useEffect, useMemo, useRef, type ComponentType, type PropsWithChildren } from 'react';
import { BackHandler, Platform } from 'react-native';

import { createEmitter } from './emitter';
import { NavNodeProvider } from './navNodeContext';
import { createStackNavigationShim } from './navigationShim';
import { INTERNAL_SLOT_NAME } from '../../constants';
import { store } from '../../global-state/store';
import { useImperativeApiEmitter } from '../../imperative-api';
import * as SplashScreen from '../../views/Splash';
import { handleHardwareBack } from '../integrate';
import { dispatchNav, NavigationStateProvider, useNavigationTree } from '../store';
import type { GlobalNavState } from '../types';

export function NewStateModelRoot({
  initial,
  wrapper: Wrapper,
}: {
  initial?: GlobalNavState;
  wrapper: ComponentType<PropsWithChildren>;
}) {
  // Drains the imperative router queue (router.push/back) — normally mounted by the RN container,
  // which we don't render under the flag. `routingQueue.run` branches to the new model.
  useImperativeApiEmitter(store.navigationRef);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, []);

  if (!initial) return null;
  return (
    <NavigationStateProvider initial={initial}>
      <Wrapper>
        <RootRenderer />
      </Wrapper>
    </NavigationStateProvider>
  );
}

function RootRenderer() {
  const tree = useNavigationTree();
  const emitter = useRef(createEmitter()).current;
  const RootComponent = store.rootComponent;

  // The root layout's screen wrapper (getQualifiedRouteComponent) consumes a `navigation` object, so
  // the root needs its own shim — distinct from the per-screen shims the Stack builds for its routes.
  const navigation = useMemo(
    () => createStackNavigationShim('root', { node: tree.root, dispatch: dispatchNav, emitter }),
    [tree.root, emitter]
  );

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <NavNodeProvider node={tree.root}>
      <RootComponent route={{ key: 'root', name: INTERNAL_SLOT_NAME }} navigation={navigation} />
    </NavNodeProvider>
  );
}

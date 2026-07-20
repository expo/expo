import type { ComponentProps } from 'react';
import { use, useMemo } from 'react';

import { RootModalContext, RootModalProvider } from '../../layouts/RootModal';
import { NativeStackView as RNNativeStackView } from '../../react-navigation/native-stack';

export function NativeStackView(props: ComponentProps<typeof RNNativeStackView>) {
  return (
    <RootModalProvider>
      <NativeStackViewInner {...props} />
    </RootModalProvider>
  );
}

function NativeStackViewInner(props: ComponentProps<typeof RNNativeStackView>) {
  const rootModals = use(RootModalContext);

  const state = useMemo(() => {
    if (rootModals.routes.length === 0) {
      return props.state;
    }

    const activeRoutes = props.state.routes.slice(0, props.state.index + 1);
    const preloadedRoutes = props.state.routes.slice(props.state.index + 1);

    return {
      ...props.state,
      index: props.state.index + rootModals.routes.length,
      routes: activeRoutes.concat(rootModals.routes, preloadedRoutes),
    };
  }, [props.state, rootModals.routes]);

  return <RNNativeStackView {...props} state={state} />;
}

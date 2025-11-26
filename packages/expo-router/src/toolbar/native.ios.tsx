import { requireNativeView } from 'expo';
import type { ViewProps } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { RouterToolbarHostProps, RouterToolbarItemProps } from './native.types';

const RouterToolbarHostView: React.ComponentType<ViewProps> = requireNativeView(
  'ExpoRouterToolbarModule',
  'RouterToolbarHostView'
);
export function RouterToolbarHost(props: RouterToolbarHostProps) {
  return (
    <RouterToolbarHostView
      {...props}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        backgroundColor: 'transparent',
      }}
    />
  );
}

const RouterToolbarItemView: React.ComponentType<
  ViewProps & { identifier: string; title?: string; systemImageName?: SFSymbol; type?: string }
> = requireNativeView('ExpoRouterToolbarModule', 'RouterToolbarItemView');
export function RouterToolbarItem(props: RouterToolbarItemProps) {
  return <RouterToolbarItemView {...props} />;
}

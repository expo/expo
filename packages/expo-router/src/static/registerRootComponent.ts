import type { ComponentType, JSX, PropsWithChildren } from 'react';
import { AppRegistry } from 'react-native-web';

import type { ExpoRootProps } from '../ExpoRoot';
import type { RequireContext } from '../types';

type InitialProps = {
  location: URL;
  context: RequireContext;
  wrapper: ComponentType<PropsWithChildren>;
};

const APP_KEY = 'App';

export function registerStaticRootComponent<P extends InitialProps>(
  component: (props: ExpoRootProps) => JSX.Element,
  initialProps: P
) {
  AppRegistry.registerComponent(APP_KEY, () => component);
  return AppRegistry.getApplication(APP_KEY, { initialProps });
}

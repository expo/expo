import type { JSX } from 'react';
// @ts-expect-error: TODO(@kitten): Define this type (seems to differ from react-native)
import { AppRegistry } from 'react-native-web';

import type { ExpoRootProps } from '../ExpoRoot';
import type { RequireContext } from '../types';

type InitialProps = {
  location: URL;
  context: RequireContext;
  wrapper: ExpoRootProps['wrapper'];
};

const APP_KEY = 'App';

export function registerStaticRootComponent<P extends InitialProps>(
  component: (props: ExpoRootProps) => JSX.Element,
  initialProps: P
) {
  AppRegistry.registerComponent(APP_KEY, () => component);
  return AppRegistry.getApplication(APP_KEY, { initialProps });
}

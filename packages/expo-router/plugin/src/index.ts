import type { RouterConfigPluginProps } from './withRouter';

export type * from './withRouter';

export default (props: RouterConfigPluginProps = {}): [string, RouterConfigPluginProps] => [
  'expo-router',
  props,
];

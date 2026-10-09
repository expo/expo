import type { Props } from './withRouter';

export type * from './withRouter';

export default (props: Props = {}): [string, Props] => ['expo-router', props];

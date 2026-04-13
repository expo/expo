import { Props } from './types';

export default (props: Props = {}): [string, Props] => ['expo-splash-screen', props];

export type { Props, AndroidSplashConfig, IOSSplashConfig } from './types';

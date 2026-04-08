import { Props } from './withSplashScreen';

export default (props: Props = {}): [string, Props] => ['expo-splash-screen', props];

export type { Props } from './withSplashScreen';

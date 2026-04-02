import { PluginConfig as Props } from './withSplashScreen';

export default (props: Props = {}): [string, Props] => ['expo-splash-screen', props];

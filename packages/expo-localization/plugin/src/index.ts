import { ConfigPluginProps as Props } from './withExpoLocalization';

export default (props: Props = {}): [string, Props] => ['expo-localization', props];

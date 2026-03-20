import { PluginConfigType as Props } from './pluginConfig';

export default (props: Props = {}): [string, Props] => ['expo-build-properties', props];

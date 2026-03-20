import { PluginConfigType as Props } from './pluginConfig';

export { PluginConfigType } from './pluginConfig';

export default (props: Props = {}): [string, Props] => ['expo-dev-launcher', props];

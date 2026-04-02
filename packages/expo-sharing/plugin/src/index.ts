import { ShareExtensionConfigPluginProps as Props } from './sharingPlugin.types';

export default (props: Props = {}): [string, Props] => ['expo-sharing', props];

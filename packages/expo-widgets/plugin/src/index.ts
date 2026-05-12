import { ExpoWidgetsConfigPluginProps as Props } from './withWidgets';

export default (props: Props = {}): [string, Props] => ['expo-widgets', props];

import { ExpoObserveConfigPluginProps as Props } from './withObserve';

export default (props: Props = {}): [string, Props] => ['expo-observe', props];

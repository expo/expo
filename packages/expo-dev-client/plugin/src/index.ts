import { DevClientPluginConfigType as Props } from './withDevClient';

export default (props: Props = {}): [string, Props] => ['expo-dev-client', props];

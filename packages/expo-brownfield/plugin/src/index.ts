import { PluginPropsType as Props } from './types';

export default (props: Props = {}): [string, Props] => ['expo-brownfield', props];

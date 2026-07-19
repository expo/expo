import { Props } from './withStatusBar';

export default (props: Props = {}): [string, Props] => ['expo-status-bar', props];

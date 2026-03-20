import { Props } from './withLocation';

export default (props: Props = {}): [string, Props] => ['expo-location', props];

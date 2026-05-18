import { Props } from './withSensors';

export default (props: Props = {}): [string, Props] => ['expo-sensors', props];

import { Props } from './withSecureStore';

export default (props: Props = {}): [string, Props] => ['expo-secure-store', props];

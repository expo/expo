import { Props } from './withLocalAuthentication';

export default (props: Props = {}): [string, Props] => ['expo-local-authentication', props];

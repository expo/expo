import { Props } from './withAppIntents';

export default (props: Props = {}): [string, Props] => ['expo-app-intents', props];
export { default as withAppIntents } from './withAppIntents';

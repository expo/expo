import { ConfigPlugin } from 'expo/config-plugins';
export type WithAudioProps = {
    microphonePermission?: string | false;
};
declare const _default: ConfigPlugin<void | WithAudioProps>;
export default _default;

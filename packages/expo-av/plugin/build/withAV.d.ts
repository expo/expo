import { ConfigPlugin } from 'expo/config-plugins';
export type WithAVProps = {
    microphonePermission?: string | false;
};
declare const _default: ConfigPlugin<void | WithAVProps>;
export default _default;

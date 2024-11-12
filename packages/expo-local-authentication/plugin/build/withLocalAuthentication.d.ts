import { ConfigPlugin } from 'expo/config-plugins';
export type WithLocalAuthenticationProps = {
    faceIDPermission?: string | false;
};
declare const _default: ConfigPlugin<void | WithLocalAuthenticationProps>;
export default _default;

import { ConfigPlugin } from 'expo/config-plugins';
export type WithContactProps = {
    contactsPermission?: string | false;
};
declare const _default: ConfigPlugin<void | WithContactProps>;
export default _default;

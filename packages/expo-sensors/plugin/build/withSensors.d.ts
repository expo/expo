import { ConfigPlugin } from 'expo/config-plugins';
export type WithSensorsProps = {
    motionPermission?: string | false;
};
declare const _default: ConfigPlugin<void | WithSensorsProps>;
export default _default;

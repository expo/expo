import { ConfigPlugin } from 'expo/config-plugins';
export type WithCalendarProps = {
    calendarPermission?: string | false;
    remindersPermission?: string | false;
};
declare const _default: ConfigPlugin<void | WithCalendarProps>;
export default _default;

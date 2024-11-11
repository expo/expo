import { ConfigPlugin } from 'expo/config-plugins';
export type WithSQLiteProps = {
    customBuildFlags?: string;
    enableFTS?: boolean;
    useSQLCipher?: boolean;
    android: {
        customBuildFlags?: string;
        enableFTS?: boolean;
        useSQLCipher?: boolean;
    };
    ios: {
        customBuildFlags?: string;
        enableFTS?: boolean;
        useSQLCipher?: boolean;
    };
};
declare const _default: ConfigPlugin<void | WithSQLiteProps>;
export default _default;

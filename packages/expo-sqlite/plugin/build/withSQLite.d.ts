import { ConfigPlugin } from 'expo/config-plugins';
interface Props {
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
}
declare const _default: ConfigPlugin<Props>;
export default _default;

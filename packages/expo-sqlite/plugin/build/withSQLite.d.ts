import { ConfigPlugin } from 'expo/config-plugins';
interface Props {
    customBuildFlags?: string;
    enableFTS?: boolean;
    useSQLCipher?: boolean;
    useLibSQL?: boolean;
    android: {
        customBuildFlags?: string;
        enableFTS?: boolean;
        useSQLCipher?: boolean;
        useLibSQL?: boolean;
    };
    ios: {
        customBuildFlags?: string;
        enableFTS?: boolean;
        useSQLCipher?: boolean;
        useLibSQL?: boolean;
    };
}
declare const _default: ConfigPlugin<Props>;
export default _default;

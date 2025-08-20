import { ConfigPlugin } from 'expo/config-plugins';
interface Props {
    customBuildFlags?: string;
    enableFTS?: boolean;
    useSQLCipher?: boolean;
    useLibSQL?: boolean;
    withSQLiteVecExtension?: boolean;
    android: {
        customBuildFlags?: string;
        enableFTS?: boolean;
        useSQLCipher?: boolean;
        useLibSQL?: boolean;
        useSQLiteVec?: boolean;
        withSQLiteVecExtension?: boolean;
    };
    ios: {
        customBuildFlags?: string;
        enableFTS?: boolean;
        useSQLCipher?: boolean;
        useLibSQL?: boolean;
        withSQLiteVecExtension?: boolean;
    };
}
declare const _default: ConfigPlugin<Props>;
export default _default;

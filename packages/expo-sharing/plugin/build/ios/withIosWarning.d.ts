import { ConfigPlugin } from '@expo/config-plugins';
type WithIosWarningProps = {
    property: string;
    warning: string;
};
declare const withIosWarning: ConfigPlugin<WithIosWarningProps>;
export default withIosWarning;

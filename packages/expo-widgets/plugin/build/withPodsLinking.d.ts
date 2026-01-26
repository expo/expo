import { ConfigPlugin } from 'expo/config-plugins';
interface PodsLinkingProps {
    targetName: string;
}
declare const withPodsLinking: ConfigPlugin<PodsLinkingProps>;
export default withPodsLinking;

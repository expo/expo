import { ConfigPlugin } from '@expo/config-plugins';
import { ResourceXMLConfig } from './withEdgeToEdge';
export declare const withConfigureEdgeToEdgeEnforcement: ConfigPlugin<{
    disableEdgeToEdgeEnforcement: boolean;
}>;
export declare function configureEdgeToEdgeEnforcement(config: ResourceXMLConfig, disableEdgeToEdgeEnforcement: boolean): ResourceXMLConfig;

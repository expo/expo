import type { ExpoConfig } from '@expo/config-types';
import { GradlePropertiesConfig } from './withEdgeToEdge';
export declare function withEdgeToEdgeEnabledGradleProperties(config: ExpoConfig, props: {
    edgeToEdgeEnabled: boolean;
}): ExpoConfig;
export declare function configureEdgeToEdgeEnabledGradleProperties(config: GradlePropertiesConfig, edgeToEdgeEnabled: boolean): GradlePropertiesConfig;

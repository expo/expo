import { App, ModuleBase } from 'expo-firebase-app';
import DynamicLink from './DynamicLink';
export declare const MODULE_NAME = "ExpoFirebaseLinks";
export declare const NAMESPACE = "links";
export declare const statics: {
    DynamicLink: typeof DynamicLink;
};
/**
 * @class Links
 */
export default class Links extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {
        DynamicLink: typeof DynamicLink;
    };
    constructor(app: App);
    /**
     * Create long Dynamic Link from parameters
     * @param parameters
     * @returns {Promise.<String>}
     */
    createDynamicLink(link: DynamicLink): Promise<string>;
    /**
     * Create short Dynamic Link from parameters
     * @param parameters
     * @returns {Promise.<String>}
     */
    createShortDynamicLink(link: DynamicLink, type?: 'SHORT' | 'UNGUESSABLE'): Promise<string>;
    /**
     * Returns the link that triggered application open
     * @returns {Promise.<String>}
     */
    getInitialLink(): Promise<string | undefined>;
    /**
     * Subscribe to dynamic links
     * @param listener
     * @returns {Function}
     */
    onLink(listener: (event: string) => any): () => any;
}
export { default as DynamicLink } from './DynamicLink';
export { default as AnalyticsParameters } from './AnalyticsParameters';
export { default as AndroidParameters } from './AndroidParameters';
export { default as IOSParameters } from './IOSParameters';
export { default as ITunesParameters } from './ITunesParameters';
export { default as NavigationParameters } from './NavigationParameters';
export { default as SocialParameters } from './SocialParameters';

import { SharedEventEmitter, ModuleBase } from 'expo-firebase-app';
import DynamicLink from './DynamicLink';
const NATIVE_EVENTS = {
    linksLinkReceived: 'Expo.Firebase.links_link_received',
};
export const MODULE_NAME = 'ExpoFirebaseLinks';
export const NAMESPACE = 'links';
export const statics = {
    DynamicLink,
};
/**
 * @class Links
 */
export default class Links extends ModuleBase {
    constructor(app) {
        super(app, {
            events: Object.values(NATIVE_EVENTS),
            moduleName: MODULE_NAME,
            hasMultiAppSupport: false,
            hasCustomUrlSupport: false,
            namespace: NAMESPACE,
        });
        SharedEventEmitter.addListener(
        // sub to internal native event - this fans out to
        // public event name: onMessage
        NATIVE_EVENTS.linksLinkReceived, ({ link }) => {
            SharedEventEmitter.emit('onLink', link);
        });
        // Tell the native module that we're ready to receive events
        if (this.nativeModule.jsInitialised) {
            this.nativeModule.jsInitialised();
        }
    }
    /**
     * Create long Dynamic Link from parameters
     * @param parameters
     * @returns {Promise.<String>}
     */
    async createDynamicLink(link) {
        if (!(link instanceof DynamicLink)) {
            throw new Error(`Links:createDynamicLink expects a 'DynamicLink' but got type ${typeof link}`);
        }
        return await this.nativeModule.createDynamicLink(link.build());
    }
    /**
     * Create short Dynamic Link from parameters
     * @param parameters
     * @returns {Promise.<String>}
     */
    async createShortDynamicLink(link, type) {
        if (!(link instanceof DynamicLink)) {
            throw new Error(`Links:createShortDynamicLink expects a 'DynamicLink' but got type ${typeof link}`);
        }
        return await this.nativeModule.createShortDynamicLink(link.build(), type);
    }
    /**
     * Returns the link that triggered application open
     * @returns {Promise.<String>}
     */
    async getInitialLink() {
        return await this.nativeModule.getInitialLink();
    }
    /**
     * Subscribe to dynamic links
     * @param listener
     * @returns {Function}
     */
    onLink(listener) {
        this.logger.info('Creating onLink listener');
        SharedEventEmitter.addListener('onLink', listener);
        return () => {
            this.logger.info('Removing onLink listener');
            SharedEventEmitter.removeListener('onLink', listener);
        };
    }
}
Links.moduleName = MODULE_NAME;
Links.namespace = NAMESPACE;
Links.statics = statics;
export { default as DynamicLink } from './DynamicLink';
export { default as AnalyticsParameters } from './AnalyticsParameters';
export { default as AndroidParameters } from './AndroidParameters';
export { default as IOSParameters } from './IOSParameters';
export { default as ITunesParameters } from './ITunesParameters';
export { default as NavigationParameters } from './NavigationParameters';
export { default as SocialParameters } from './SocialParameters';
//# sourceMappingURL=index.js.map
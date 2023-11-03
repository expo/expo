import { EventEmitter } from 'fbemitter';
import * as logger from './logger';
// This version should be synced with the one in the **createMessageSocketEndpoint.ts** in @react-native-community/cli-server-api
export const MESSAGE_PROTOCOL_VERSION = 2;
export const DevToolsPluginMethod = 'Expo:DevToolsPlugin';
/**
 * This client is for the Expo DevTools Plugins to communicate between the app and the DevTools webpage hosted in a browser.
 * All the code should be both compatible with browsers and React Native.
 */
export class DevToolsPluginClient {
    connectionInfo;
    eventEmitter = new EventEmitter();
    constructor(connectionInfo) {
        this.connectionInfo = connectionInfo;
    }
    /**
     * Subscribe to a message from the other end of DevTools.
     * @param method Subscribe to a message with a method name.
     * @param listener Listener to be called when a message is received.
     */
    addMessageListener(method, listener) {
        return this.eventEmitter.addListener(method, listener);
    }
    /**
     * Subscribe to a message from the other end of DevTools just once.
     * @param method Subscribe to a message with a method name.
     * @param listener Listener to be called when a message is received.
     */
    addMessageListenerOnce(method, listener) {
        this.eventEmitter.once(method, listener);
    }
    handleMessage = (event) => {
        let payload;
        try {
            payload = JSON.parse(event.data);
        }
        catch (e) {
            logger.info('Failed to parse JSON', e);
            return;
        }
        if (payload.version !== MESSAGE_PROTOCOL_VERSION || payload.method !== DevToolsPluginMethod) {
            return;
        }
        if (payload.pluginName && payload.pluginName !== this.connectionInfo.pluginName) {
            return;
        }
        this.eventEmitter.emit(payload.params.method, payload.params.params);
    };
}
//# sourceMappingURL=DevToolsPluginClient.js.map
/**
 * @flow
 * Messaging (FCM) representation wrapper
 */
import { Platform } from 'expo-core';
import { events, internals, ModuleBase, registerModule, utils } from 'expo-firebase-app';

import RemoteMessage from './RemoteMessage';

import type App from 'expo-firebase-app';
import type {
  NativeInboundRemoteMessage,
  NativeOutboundRemoteMessage,
  Notification,
} from './types';

const { SharedEventEmitter } = events;
const { isFunction, isObject } = utils;

export type OnMessage = RemoteMessage => any;

export type OnMessageObserver = {
  next: OnMessage,
};

export type OnTokenRefresh = string => any;

export type OnTokenRefreshObserver = {
  next: OnTokenRefresh,
};

const NATIVE_EVENTS = [
  'Expo.Firebase.messaging_message_received',
  'Expo.Firebase.messaging_token_refreshed',
];

export const MODULE_NAME = 'ExpoFirebaseMessaging';
export const NAMESPACE = 'messaging';

export const statics = {
  RemoteMessage,
};

/**
 * @class Messaging
 */
export default class Messaging extends ModuleBase {
  static moduleName = MODULE_NAME;
  static namespace = NAMESPACE;
  static statics = statics;

  constructor(app: App) {
    super(app, {
      events: NATIVE_EVENTS,
      moduleName: MODULE_NAME,
      hasMultiAppSupport: false,
      hasCustomUrlSupport: false,
      namespace: NAMESPACE,
    });

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onMessage
      'Expo.Firebase.messaging_message_received',
      (message: NativeInboundRemoteMessage) => {
        SharedEventEmitter.emit('onMessage', new RemoteMessage(message));
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onMessage
      'Expo.Firebase.messaging_token_refreshed',
      ({ token }) => {
        SharedEventEmitter.emit('onTokenRefresh', token);
      }
    );

    // Tell the native module that we're ready to receive events
    if (Platform.OS === 'ios') {
      this.nativeModule.jsInitialised();
    }
  }

  onMessage(nextOrObserver: OnMessage | OnMessageObserver): () => any {
    let listener: RemoteMessage => any;
    if (isFunction(nextOrObserver)) {
      // $FlowExpectedError: Not coping with the overloaded method signature
      listener = nextOrObserver;
    } else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
      listener = nextOrObserver.next;
    } else {
      throw new Error(
        'Messaging.onMessage failed: First argument must be a function or observer object with a `next` function.'
      );
    }

    this.logger.info('Creating onMessage listener');

    SharedEventEmitter.addListener('onMessage', listener);

    return () => {
      this.logger.info('Removing onMessage listener');
      SharedEventEmitter.removeListener('onMessage', listener);
    };
  }

  onTokenRefresh(nextOrObserver: OnTokenRefresh | OnTokenRefreshObserver): () => any {
    let listener: string => any;
    if (isFunction(nextOrObserver)) {
      // $FlowExpectedError: Not coping with the overloaded method signature
      listener = nextOrObserver;
    } else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
      listener = nextOrObserver.next;
    } else {
      throw new Error(
        'Messaging.OnTokenRefresh failed: First argument must be a function or observer object with a `next` function.'
      );
    }

    this.logger.info('Creating onTokenRefresh listener');
    SharedEventEmitter.addListener('onTokenRefresh', listener);

    return () => {
      this.logger.info('Removing onTokenRefresh listener');
      SharedEventEmitter.removeListener('onTokenRefresh', listener);
    };
  }

  /**
   * NON WEB-SDK METHODS
   */

  sendMessage(remoteMessage: RemoteMessage): Promise<void> {
    if (!(remoteMessage instanceof RemoteMessage)) {
      return Promise.reject(
        new Error(
          `Messaging:sendMessage expects a 'RemoteMessage' but got type ${typeof remoteMessage}`
        )
      );
    }
    try {
      return this.nativeModule.sendMessage(remoteMessage.build());
    } catch (error) {
      return Promise.reject(error);
    }
  }

  subscribeToTopic(topic: string): Promise<void> {
    return this.nativeModule.subscribeToTopic(topic);
  }

  unsubscribeFromTopic(topic: string): Promise<void> {
    return this.nativeModule.unsubscribeFromTopic(topic);
  }

  /**
   * KNOWN UNSUPPORTED METHODS
   */

  getToken(): Promise<string> {
    throw new Error(internals.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'getToken'));
  }

  requestPermission(): Promise<void> {
    throw new Error(
      internals.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'requestPermission')
    );
  }

  hasPermission(): Promise<boolean> {
    throw new Error(
      internals.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'hasPermission')
    );
  }

  deleteToken() {
    throw new Error(internals.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'deleteToken'));
  }

  setBackgroundMessageHandler() {
    throw new Error(
      internals.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'setBackgroundMessageHandler')
    );
  }

  useServiceWorker() {
    throw new Error(
      internals.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'useServiceWorker')
    );
  }
}

registerModule(Messaging);

export type {
  NativeInboundRemoteMessage,
  NativeOutboundRemoteMessage,
  Notification,
} from './types';
export { RemoteMessage };

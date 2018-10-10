/**
 * @flow
 * Messaging (FCM) representation wrapper
 */
import { Platform } from 'expo-core';
import {
  events,
  internals,
  getLogger,
  ModuleBase,
  getNativeModule,
  registerModule,
  utils,
} from 'expo-firebase-app';
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

const NATIVE_EVENTS = ['messaging_message_received', 'messaging_token_refreshed'];

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
      multiApp: false,
      hasShards: false,
      namespace: NAMESPACE,
    });

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onMessage
      'messaging_message_received',
      (message: NativeInboundRemoteMessage) => {
        SharedEventEmitter.emit('onMessage', new RemoteMessage(message));
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onMessage
      'messaging_token_refreshed',
      ({ token }) => {
        SharedEventEmitter.emit('onTokenRefresh', token);
      }
    );

    // Tell the native module that we're ready to receive events
    if (Platform.OS === 'ios') {
      getNativeModule(this).jsInitialised();
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

    getLogger(this).info('Creating onMessage listener');

    SharedEventEmitter.addListener('onMessage', listener);

    return () => {
      getLogger(this).info('Removing onMessage listener');
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

    getLogger(this).info('Creating onTokenRefresh listener');
    SharedEventEmitter.addListener('onTokenRefresh', listener);

    return () => {
      getLogger(this).info('Removing onTokenRefresh listener');
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
      return getNativeModule(this).sendMessage(remoteMessage.build());
    } catch (error) {
      return Promise.reject(error);
    }
  }

  subscribeToTopic(topic: string): Promise<void> {
    return getNativeModule(this).subscribeToTopic(topic);
  }

  unsubscribeFromTopic(topic: string): Promise<void> {
    return getNativeModule(this).unsubscribeFromTopic(topic);
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

/**
 * @flow
 * Messaging (FCM) representation wrapper
 */
import { INTERNALS, ModuleBase, SharedEventEmitter, utils } from 'expo-firebase-app';
import invariant from 'invariant';
import type App from 'expo-firebase-app';

import IOSMessaging from './IOSMessaging';
import RemoteMessage from './RemoteMessage';

import type { NativeInboundRemoteMessage } from './types';

const { isFunction, isObject } = utils;

export type OnMessage = RemoteMessage => any;

export type OnMessageObserver = {
  next: OnMessage,
};

export type OnTokenRefresh = string => any;

export type OnTokenRefreshObserver = {
  next: OnTokenRefresh,
};

const NATIVE_EVENTS = {
  messageReceived: 'Expo.Firebase.messaging_message_received',
  tokenRefreshed: 'Expo.Firebase.messaging_token_refreshed',
};

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
  _ios: IOSMessaging;

  constructor(app: App) {
    super(app, {
      events: Object.values(NATIVE_EVENTS),
      moduleName: MODULE_NAME,
      hasMultiAppSupport: false,
      hasCustomUrlSupport: false,
      namespace: NAMESPACE,
    });
    this._ios = new IOSMessaging(this);

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onMessage
      NATIVE_EVENTS.messageReceived,
      (message: NativeInboundRemoteMessage) => {
        SharedEventEmitter.emit('onMessage', new RemoteMessage(message));
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onMessage
      NATIVE_EVENTS.tokenRefreshed,
      ({ token }) => {
        SharedEventEmitter.emit('onTokenRefresh', token);
      }
    );

    // Tell the native module that we're ready to receive events
    if (this.nativeModule.jsInitialised) {
      this.nativeModule.jsInitialised();
    }
  }

  get ios(): IOSMessaging {
    return this._ios;
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
        'Messaging.onTokenRefresh failed: First argument must be a function or observer object with a `next` function.'
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
    invariant(
      remoteMessage instanceof RemoteMessage,
      `Messaging:sendMessage expects a 'RemoteMessage' but got type ${typeof remoteMessage}`
    );
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
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'getToken'));
  }

  requestPermission(): Promise<void> {
    throw new Error(
      INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'requestPermission')
    );
  }

  hasPermission(): Promise<boolean> {
    throw new Error(
      INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'hasPermission')
    );
  }

  deleteToken() {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'deleteToken'));
  }

  setBackgroundMessageHandler() {
    throw new Error(
      INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'setBackgroundMessageHandler')
    );
  }

  useServiceWorker() {
    throw new Error(
      INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'useServiceWorker')
    );
  }
}

export type {
  NativeInboundRemoteMessage,
  NativeOutboundRemoteMessage,
  Notification,
} from './types';
export { RemoteMessage };

/**
 * @flow
 * Dynamic Links representation wrapper
 */
import { Platform } from 'expo-core';
import { events, ModuleBase, registerModule } from 'expo-firebase-app';

import DynamicLink from './DynamicLink';

import type App from 'expo-firebase-app';

const { SharedEventEmitter } = events;
const NATIVE_EVENTS = ['Expo.Firebase.links_link_received'];

export const MODULE_NAME = 'ExpoFirebaseLinks';
export const NAMESPACE = 'links';

export const statics = {
  DynamicLink,
};

/**
 * @class Links
 */
export default class Links extends ModuleBase {
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
      'Expo.Firebase.links_link_received',
      ({ link }) => {
        SharedEventEmitter.emit('onLink', link);
      }
    );

    // Tell the native module that we're ready to receive events
    if (Platform.OS === 'ios') {
      this.nativeModule.jsInitialised();
    }
  }

  /**
   * Create long Dynamic Link from parameters
   * @param parameters
   * @returns {Promise.<String>}
   */
  createDynamicLink(link: DynamicLink): Promise<string> {
    if (!(link instanceof DynamicLink)) {
      return Promise.reject(
        new Error(`Links:createDynamicLink expects a 'DynamicLink' but got type ${typeof link}`)
      );
    }
    try {
      return this.nativeModule.createDynamicLink(link.build());
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Create short Dynamic Link from parameters
   * @param parameters
   * @returns {Promise.<String>}
   */
  createShortDynamicLink(link: DynamicLink, type?: 'SHORT' | 'UNGUESSABLE'): Promise<String> {
    if (!(link instanceof DynamicLink)) {
      return Promise.reject(
        new Error(
          `Links:createShortDynamicLink expects a 'DynamicLink' but got type ${typeof link}`
        )
      );
    }
    try {
      return this.nativeModule.createShortDynamicLink(link.build(), type);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Returns the link that triggered application open
   * @returns {Promise.<String>}
   */
  getInitialLink(): Promise<?string> {
    return this.nativeModule.getInitialLink();
  }

  /**
   * Subscribe to dynamic links
   * @param listener
   * @returns {Function}
   */
  onLink(listener: string => any): () => any {
    this.logger.info('Creating onLink listener');

    SharedEventEmitter.addListener('onLink', listener);

    return () => {
      this.logger.info('Removing onLink listener');
      SharedEventEmitter.removeListener('onLink', listener);
    };
  }
}

export { default as DynamicLink } from './DynamicLink';
export { default as AnalyticsParameters } from './AnalyticsParameters';
export { default as AndroidParameters } from './AndroidParameters';
export { default as IOSParameters } from './IOSParameters';
export { default as ITunesParameters } from './ITunesParameters';
export { default as NavigationParameters } from './NavigationParameters';
export { default as SocialParameters } from './SocialParameters';

registerModule(Links);

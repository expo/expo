/**
 * @flow
 * Dynamic Links representation wrapper
 */
import { events, getLogger, ModuleBase, getNativeModule, registerModule } from 'expo-firebase-app';
import type App from 'expo-firebase-app';

import { Platform } from 'expo-core';
import DynamicLink from './DynamicLink';
const { SharedEventEmitter } = events;
const NATIVE_EVENTS = ['links_link_received'];

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
      multiApp: false,
      hasShards: false,
      namespace: NAMESPACE,
    });

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onMessage
      'links_link_received',
      ({ link }) => {
        SharedEventEmitter.emit('onLink', link);
      }
    );

    // Tell the native module that we're ready to receive events
    if (Platform.OS === 'ios') {
      getNativeModule(this).jsInitialised();
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
      return getNativeModule(this).createDynamicLink(link.build());
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
      return getNativeModule(this).createShortDynamicLink(link.build(), type);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Returns the link that triggered application open
   * @returns {Promise.<String>}
   */
  getInitialLink(): Promise<?string> {
    return getNativeModule(this).getInitialLink();
  }

  /**
   * Subscribe to dynamic links
   * @param listener
   * @returns {Function}
   */
  onLink(listener: string => any): () => any {
    getLogger(this).info('Creating onLink listener');

    SharedEventEmitter.addListener('onLink', listener);

    return () => {
      getLogger(this).info('Removing onLink listener');
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

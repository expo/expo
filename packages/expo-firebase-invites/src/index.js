/**
 * @flow
 * Invites representation wrapper
 */
import { Platform } from 'expo-core';
import { events, ModuleBase, registerModule } from 'expo-firebase-app';

import Invitation from './Invitation';

import type App from 'expo-firebase-app';
const { SharedEventEmitter } = events;

export const MODULE_NAME = 'ExpoFirebaseInvites';
export const NAMESPACE = 'invites';
const NATIVE_EVENTS = ['Expo.Firebase.invites_invitation_received'];

export const statics = {
  Invitation,
};

type InvitationOpen = {
  deepLink: string,
  invitationId: string,
};

export default class Invites extends ModuleBase {
  static moduleName = MODULE_NAME;
  static namespace = NAMESPACE;
  static statics = statics;

  constructor(app: App) {
    super(app, {
      events: NATIVE_EVENTS,
      hasCustomUrlSupport: false,
      moduleName: MODULE_NAME,
      hasMultiAppSupport: false,
      namespace: NAMESPACE,
    });

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onMessage
      'Expo.Firebase.invites_invitation_received',
      (invitation: InvitationOpen) => {
        SharedEventEmitter.emit('onInvitation', invitation);
      }
    );

    // Tell the native module that we're ready to receive events
    if (Platform.OS === 'ios') {
      this.nativeModule.jsInitialised();
    }
  }

  /**
   * Returns the invitation that triggered application open
   * @returns {Promise.<InvitationOpen>}
   */
  getInitialInvitation(): Promise<?InvitationOpen> {
    return this.nativeModule.getInitialInvitation();
  }

  /**
   * Subscribe to invites
   * @param listener
   * @returns {Function}
   */
  onInvitation(listener: InvitationOpen => any) {
    this.logger.info('Creating onInvitation listener');

    SharedEventEmitter.addListener('onInvitation', listener);

    return () => {
      this.logger.info('Removing onInvitation listener');
      SharedEventEmitter.removeListener('onInvitation', listener);
    };
  }

  sendInvitation(invitation: Invitation): Promise<string[]> {
    if (!(invitation instanceof Invitation)) {
      return Promise.reject(
        new Error(
          `Invites:sendInvitation expects an 'Invitation' but got type ${typeof invitation}`
        )
      );
    }
    try {
      return this.nativeModule.sendInvitation(invitation.build());
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export { default as Invitation } from './Invitation';

registerModule(Invites);

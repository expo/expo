/**
 * @flow
 * Invites representation wrapper
 */
import { events, getLogger, ModuleBase, getNativeModule, registerModule } from 'expo-firebase-app';
import { Platform } from 'expo-core';
import type App from 'expo-firebase-app';
const { SharedEventEmitter } = events;
import Invitation from './Invitation';

export const MODULE_NAME = 'ExpoFirebaseInvites';
export const NAMESPACE = 'invites';
const NATIVE_EVENTS = ['invites_invitation_received'];

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
      hasShards: false,
      moduleName: MODULE_NAME,
      multiApp: false,
      namespace: NAMESPACE,
    });

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onMessage
      'invites_invitation_received',
      (invitation: InvitationOpen) => {
        SharedEventEmitter.emit('onInvitation', invitation);
      }
    );

    // Tell the native module that we're ready to receive events
    if (Platform.OS === 'ios') {
      getNativeModule(this).jsInitialised();
    }
  }

  /**
   * Returns the invitation that triggered application open
   * @returns {Promise.<InvitationOpen>}
   */
  getInitialInvitation(): Promise<?InvitationOpen> {
    return getNativeModule(this).getInitialInvitation();
  }

  /**
   * Subscribe to invites
   * @param listener
   * @returns {Function}
   */
  onInvitation(listener: InvitationOpen => any) {
    getLogger(this).info('Creating onInvitation listener');

    SharedEventEmitter.addListener('onInvitation', listener);

    return () => {
      getLogger(this).info('Removing onInvitation listener');
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
      return getNativeModule(this).sendInvitation(invitation.build());
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export { default as Invitation } from './Invitation';

registerModule(Invites);

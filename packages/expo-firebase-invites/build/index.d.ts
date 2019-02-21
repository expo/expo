import { App, ModuleBase } from 'expo-firebase-app';
import Invitation from './Invitation';
export declare const MODULE_NAME = "ExpoFirebaseInvites";
export declare const NAMESPACE = "invites";
export declare const statics: {
    Invitation: typeof Invitation;
};
declare type InvitationOpen = {
    deepLink: string;
    invitationId: string;
};
export default class Invites extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {
        Invitation: typeof Invitation;
    };
    constructor(app: App);
    /**
     * Returns the invitation that triggered application open
     * @returns {Promise.<InvitationOpen>}
     */
    getInitialInvitation(): Promise<InvitationOpen | undefined>;
    /**
     * Subscribe to invites
     * @param listener
     * @returns {Function}
     */
    onInvitation(listener: (InvitationOpen: any) => any): () => void;
    sendInvitation(invitation: Invitation): Promise<string[]>;
}
export { default as Invitation } from './Invitation';

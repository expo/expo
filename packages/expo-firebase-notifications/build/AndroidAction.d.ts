import RemoteInput from './AndroidRemoteInput';
import { NativeAndroidAction, SemanticAction } from './types';
export default class AndroidAction {
    _action: string;
    _allowGeneratedReplies?: boolean;
    _icon: string;
    _remoteInputs: RemoteInput[];
    _semanticAction?: SemanticAction;
    _showUserInterface?: boolean;
    _title: string;
    constructor(action: string, icon: string, title: string);
    readonly action: string;
    readonly allowGeneratedReplies: boolean | undefined;
    readonly icon: string;
    readonly remoteInputs: RemoteInput[];
    readonly semanticAction: SemanticAction | undefined;
    readonly showUserInterface: boolean | undefined;
    readonly title: string;
    /**
     *
     * @param remoteInput
     * @returns {AndroidAction}
     */
    addRemoteInput(remoteInput: RemoteInput): AndroidAction;
    /**
     *
     * @param allowGeneratedReplies
     * @returns {AndroidAction}
     */
    setAllowGenerateReplies(allowGeneratedReplies: boolean): AndroidAction;
    /**
     *
     * @param semanticAction
     * @returns {AndroidAction}
     */
    setSemanticAction(semanticAction: SemanticAction): AndroidAction;
    /**
     *
     * @param showUserInterface
     * @returns {AndroidAction}
     */
    setShowUserInterface(showUserInterface: boolean): AndroidAction;
    build(): NativeAndroidAction;
}
export declare const fromNativeAndroidAction: (nativeAction: NativeAndroidAction) => AndroidAction;

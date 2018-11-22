// @flow

import invariant from 'invariant';
import RemoteInput, { fromNativeAndroidRemoteInput } from './AndroidRemoteInput';
import { SemanticAction } from './types';
import type { NativeAndroidAction, SemanticActionType } from './types';

export default class AndroidAction {
  _action: string;

  _allowGeneratedReplies: boolean | void;

  _icon: string;

  _remoteInputs: RemoteInput[];

  _semanticAction: SemanticActionType | void;

  _showUserInterface: boolean | void;

  _title: string;

  constructor(action: string, icon: string, title: string) {
    this._action = action;
    this._icon = icon;
    this._remoteInputs = [];
    this._showUserInterface = true;
    this._title = title;
  }

  get action(): string {
    return this._action;
  }

  get allowGeneratedReplies(): ?boolean {
    return this._allowGeneratedReplies;
  }

  get icon(): string {
    return this._icon;
  }

  get remoteInputs(): RemoteInput[] {
    return this._remoteInputs;
  }

  get semanticAction(): ?SemanticActionType {
    return this._semanticAction;
  }

  get showUserInterface(): ?boolean {
    return this._showUserInterface;
  }

  get title(): string {
    return this._title;
  }

  /**
   *
   * @param remoteInput
   * @returns {AndroidAction}
   */
  addRemoteInput(remoteInput: RemoteInput): AndroidAction {
    invariant(
      remoteInput instanceof RemoteInput,
      `AndroidAction:addRemoteInput expects an 'RemoteInput' but got type ${typeof remoteInput}`
    );
    this._remoteInputs.push(remoteInput);
    return this;
  }

  /**
   *
   * @param allowGeneratedReplies
   * @returns {AndroidAction}
   */
  setAllowGenerateReplies(allowGeneratedReplies: boolean): AndroidAction {
    this._allowGeneratedReplies = allowGeneratedReplies;
    return this;
  }

  /**
   *
   * @param semanticAction
   * @returns {AndroidAction}
   */
  setSemanticAction(semanticAction: SemanticActionType): AndroidAction {
    invariant(
      Object.values(SemanticAction).includes(semanticAction),
      `AndroidAction:setSemanticAction Invalid Semantic Action: ${semanticAction}`
    );
    this._semanticAction = semanticAction;
    return this;
  }

  /**
   *
   * @param showUserInterface
   * @returns {AndroidAction}
   */
  setShowUserInterface(showUserInterface: boolean): AndroidAction {
    this._showUserInterface = showUserInterface;
    return this;
  }

  build(): NativeAndroidAction {
    invariant(this._action, 'AndroidAction: Missing required `action` property');
    invariant(this._icon, 'AndroidAction: Missing required `icon` property');
    invariant(this._title, 'AndroidAction: Missing required `title` property');
    return {
      action: this._action,
      allowGeneratedReplies: this._allowGeneratedReplies,
      icon: this._icon,
      remoteInputs: this._remoteInputs.map(remoteInput => remoteInput.build()),
      semanticAction: this._semanticAction,
      showUserInterface: this._showUserInterface,
      title: this._title,
    };
  }
}

export const fromNativeAndroidAction = (nativeAction: NativeAndroidAction): AndroidAction => {
  const action = new AndroidAction(nativeAction.action, nativeAction.icon, nativeAction.title);
  if (nativeAction.allowGeneratedReplies) {
    action.setAllowGenerateReplies(nativeAction.allowGeneratedReplies);
  }
  if (nativeAction.remoteInputs) {
    nativeAction.remoteInputs.forEach(remoteInput => {
      action.addRemoteInput(fromNativeAndroidRemoteInput(remoteInput));
    });
  }
  if (nativeAction.semanticAction) {
    action.setSemanticAction(nativeAction.semanticAction);
  }
  if (nativeAction.showUserInterface) {
    action.setShowUserInterface(nativeAction.showUserInterface);
  }

  return action;
};

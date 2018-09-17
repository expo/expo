/**
 * @flow
 * AndroidRemoteInput representation wrapper
 */

import type { AndroidAllowDataType, NativeAndroidRemoteInput } from './types';

export default class AndroidRemoteInput {
  _allowedDataTypes: AndroidAllowDataType[];

  _allowFreeFormInput: boolean | void;

  _choices: string[];

  _label: string | void;

  _resultKey: string;

  constructor(resultKey: string) {
    this._allowedDataTypes = [];
    this._choices = [];
    this._resultKey = resultKey;
  }

  get allowedDataTypes(): AndroidAllowDataType[] {
    return this._allowedDataTypes;
  }

  get allowFreeFormInput(): ?boolean {
    return this._allowFreeFormInput;
  }

  get choices(): string[] {
    return this._choices;
  }

  get label(): ?string {
    return this._label;
  }

  get resultKey(): string {
    return this._resultKey;
  }

  /**
   *
   * @param mimeType
   * @param allow
   * @returns {AndroidRemoteInput}
   */
  setAllowDataType(mimeType: string, allow: boolean): AndroidRemoteInput {
    this._allowedDataTypes.push({
      allow,
      mimeType,
    });
    return this;
  }

  /**
   *
   * @param allowFreeFormInput
   * @returns {AndroidRemoteInput}
   */
  setAllowFreeFormInput(allowFreeFormInput: boolean): AndroidRemoteInput {
    this._allowFreeFormInput = allowFreeFormInput;
    return this;
  }

  /**
   *
   * @param choices
   * @returns {AndroidRemoteInput}
   */
  setChoices(choices: string[]): AndroidRemoteInput {
    this._choices = choices;
    return this;
  }

  /**
   *
   * @param label
   * @returns {AndroidRemoteInput}
   */
  setLabel(label: string): AndroidRemoteInput {
    this._label = label;
    return this;
  }

  build(): NativeAndroidRemoteInput {
    if (!this._resultKey) {
      throw new Error(
        'AndroidRemoteInput: Missing required `resultKey` property'
      );
    }

    return {
      allowedDataTypes: this._allowedDataTypes,
      allowFreeFormInput: this._allowFreeFormInput,
      choices: this._choices,
      label: this._label,
      resultKey: this._resultKey,
    };
  }
}

export const fromNativeAndroidRemoteInput = (
  nativeRemoteInput: NativeAndroidRemoteInput
): AndroidRemoteInput => {
  const remoteInput = new AndroidRemoteInput(nativeRemoteInput.resultKey);
  if (nativeRemoteInput.allowedDataTypes) {
    for (let i = 0; i < nativeRemoteInput.allowedDataTypes.length; i++) {
      const allowDataType = nativeRemoteInput.allowedDataTypes[i];
      remoteInput.setAllowDataType(allowDataType.mimeType, allowDataType.allow);
    }
  }
  if (nativeRemoteInput.allowFreeFormInput) {
    remoteInput.setAllowFreeFormInput(nativeRemoteInput.allowFreeFormInput);
  }
  if (nativeRemoteInput.choices) {
    remoteInput.setChoices(nativeRemoteInput.choices);
  }
  if (nativeRemoteInput.label) {
    remoteInput.setLabel(nativeRemoteInput.label);
  }

  return remoteInput;
};

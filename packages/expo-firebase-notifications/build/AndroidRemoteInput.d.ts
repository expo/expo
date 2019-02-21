import { AndroidAllowDataType, NativeAndroidRemoteInput } from './types';
export default class AndroidRemoteInput {
    _allowedDataTypes: AndroidAllowDataType[];
    _allowFreeFormInput?: boolean;
    _choices: string[];
    _label?: string;
    _resultKey: string;
    constructor(resultKey: string);
    readonly allowedDataTypes: AndroidAllowDataType[];
    readonly allowFreeFormInput: boolean | undefined;
    readonly choices: string[];
    readonly label: string | undefined;
    readonly resultKey: string;
    /**
     *
     * @param mimeType
     * @param allow
     * @returns {AndroidRemoteInput}
     */
    setAllowDataType(mimeType: string, allow: boolean): AndroidRemoteInput;
    /**
     *
     * @param allowFreeFormInput
     * @returns {AndroidRemoteInput}
     */
    setAllowFreeFormInput(allowFreeFormInput: boolean): AndroidRemoteInput;
    /**
     *
     * @param choices
     * @returns {AndroidRemoteInput}
     */
    setChoices(choices: string[]): AndroidRemoteInput;
    /**
     *
     * @param label
     * @returns {AndroidRemoteInput}
     */
    setLabel(label: string): AndroidRemoteInput;
    build(): NativeAndroidRemoteInput;
}
export declare const fromNativeAndroidRemoteInput: (nativeRemoteInput: NativeAndroidRemoteInput) => AndroidRemoteInput;

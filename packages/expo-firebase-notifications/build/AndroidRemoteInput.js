import invariant from 'invariant';
export default class AndroidRemoteInput {
    constructor(resultKey) {
        this._allowedDataTypes = [];
        this._choices = [];
        this._resultKey = resultKey;
    }
    get allowedDataTypes() {
        return this._allowedDataTypes;
    }
    get allowFreeFormInput() {
        return this._allowFreeFormInput;
    }
    get choices() {
        return this._choices;
    }
    get label() {
        return this._label;
    }
    get resultKey() {
        return this._resultKey;
    }
    /**
     *
     * @param mimeType
     * @param allow
     * @returns {AndroidRemoteInput}
     */
    setAllowDataType(mimeType, allow) {
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
    setAllowFreeFormInput(allowFreeFormInput) {
        this._allowFreeFormInput = allowFreeFormInput;
        return this;
    }
    /**
     *
     * @param choices
     * @returns {AndroidRemoteInput}
     */
    setChoices(choices) {
        this._choices = choices;
        return this;
    }
    /**
     *
     * @param label
     * @returns {AndroidRemoteInput}
     */
    setLabel(label) {
        this._label = label;
        return this;
    }
    build() {
        invariant(this._resultKey, 'AndroidRemoteInput: Missing required `resultKey` property');
        return {
            allowedDataTypes: this._allowedDataTypes,
            allowFreeFormInput: this._allowFreeFormInput,
            choices: this._choices,
            label: this._label,
            resultKey: this._resultKey,
        };
    }
}
export const fromNativeAndroidRemoteInput = (nativeRemoteInput) => {
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
//# sourceMappingURL=AndroidRemoteInput.js.map
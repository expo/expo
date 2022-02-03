// @needsAudit
export var AuthenticationType;
(function (AuthenticationType) {
    /**
     * Indicates fingerprint support.
     */
    AuthenticationType[AuthenticationType["FINGERPRINT"] = 1] = "FINGERPRINT";
    /**
     * Indicates facial recognition support.
     */
    AuthenticationType[AuthenticationType["FACIAL_RECOGNITION"] = 2] = "FACIAL_RECOGNITION";
    /**
     * Indicates iris recognition support.
     * @platform android
     */
    AuthenticationType[AuthenticationType["IRIS"] = 3] = "IRIS";
})(AuthenticationType || (AuthenticationType = {}));
// @needsAudit
export var SecurityLevel;
(function (SecurityLevel) {
    /**
     * Indicates no enrolled authentication.
     */
    SecurityLevel[SecurityLevel["NONE"] = 0] = "NONE";
    /**
     * Indicates non-biometric authentication (e.g. PIN, Pattern).
     */
    SecurityLevel[SecurityLevel["SECRET"] = 1] = "SECRET";
    /**
     * Indicates biometric authentication.
     */
    SecurityLevel[SecurityLevel["BIOMETRIC"] = 2] = "BIOMETRIC";
})(SecurityLevel || (SecurityLevel = {}));
//# sourceMappingURL=LocalAuthentication.types.js.map
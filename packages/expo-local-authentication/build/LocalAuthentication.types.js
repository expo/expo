import { Platform } from 'expo-modules-core';
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
     * @deprecated please use `BIOMETRIC_STRONG` or `BIOMETRIC_WEAK` instead.
     * @hidden
     */
    SecurityLevel[SecurityLevel["BIOMETRIC"] = Platform.OS === 'android'
        ? SecurityLevel.BIOMETRIC_WEAK
        : SecurityLevel.BIOMETRIC_STRONG] = "BIOMETRIC";
    /**
     * Indicates weak biometric authentication. For example, a 2D image-based face unlock.
     * > There are currently no weak biometric authentication options on iOS.
     */
    SecurityLevel[SecurityLevel["BIOMETRIC_WEAK"] = 2] = "BIOMETRIC_WEAK";
    /**
     * Indicates strong biometric authentication. For example, a fingerprint scan or 3D face unlock.
     */
    SecurityLevel[SecurityLevel["BIOMETRIC_STRONG"] = 3] = "BIOMETRIC_STRONG";
})(SecurityLevel || (SecurityLevel = {}));
Object.defineProperty(SecurityLevel, 'BIOMETRIC', {
    get() {
        const additionalMessage = Platform.OS === 'android'
            ? '. `SecurityLevel.BIOMETRIC` is currently an alias for `SecurityLevel.BIOMETRIC_WEAK` on Android, which might lead to unexpected behaviour.'
            : '';
        console.warn('`SecurityLevel.BIOMETRIC` has been deprecated. Please use `SecurityLevel.BIOMETRIC_WEAK` or `SecurityLevel.BIOMETRIC_STRONG` instead' +
            additionalMessage);
        return Platform.OS === 'android'
            ? SecurityLevel.BIOMETRIC_WEAK
            : SecurityLevel.BIOMETRIC_STRONG;
    },
});
//# sourceMappingURL=LocalAuthentication.types.js.map
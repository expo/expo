export var AuthenticationType;
(function (AuthenticationType) {
    AuthenticationType[AuthenticationType["FINGERPRINT"] = 1] = "FINGERPRINT";
    AuthenticationType[AuthenticationType["FACIAL_RECOGNITION"] = 2] = "FACIAL_RECOGNITION";
    // Android only
    AuthenticationType[AuthenticationType["IRIS"] = 3] = "IRIS";
})(AuthenticationType || (AuthenticationType = {}));
export var SecurityLevel;
(function (SecurityLevel) {
    SecurityLevel[SecurityLevel["NONE"] = 0] = "NONE";
    SecurityLevel[SecurityLevel["SECRET"] = 1] = "SECRET";
    SecurityLevel[SecurityLevel["BIOMETRIC"] = 2] = "BIOMETRIC";
})(SecurityLevel || (SecurityLevel = {}));
//# sourceMappingURL=LocalAuthentication.types.js.map
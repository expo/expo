/**
 * A boolean value that indicates whether a particular device provides the [App Attest](https://developer.apple.com/documentation/devicecheck/establishing-your-app-s-integrity) service.
 * Not all device types support the App Attest service, so check for support before using the service.
 * @platform ios
 */
export declare const isSupported: boolean;
/**
 * Creates a new cryptographic key for use with the App Attest service.
 * @return A Promise that is fulfilled with a string that contains the key identifier. The key itself is stored securely in the Secure Enclave.
 * @platform ios
 */
export declare function generateKeyAsync(): Promise<string>;
/**
 * Asks Apple to attest to the validity of a generated cryptographic key.
 * @param keyId The identifier you received by calling the `generateKey` function.
 * @param challenge A challenge string from your server.
 * @return A Promise that is fulfilled with a string that contains the attestation data. A statement from Apple about the validity of the key associated with keyId. Send this to your server for processing.
 * @platform ios
 */
export declare function attestKeyAsync(keyId: string, challenge: string): Promise<string>;
/**
 * Creates a block of data that demonstrates the legitimacy of an instance of your app running on a device.
 * @param keyId The identifier you received by calling the `generateKey` function.
 * @param challenge A string to be signed with the attested private key.
 * @return A Promise that is fulfilled with a string that contains the assertion object. A data structure that you send to your server for processing.
 * @platform ios
 */
export declare function generateAssertionAsync(keyId: string, challenge: string): Promise<string>;
/**
 * Prepares the integrity token provider for the given cloud project number.
 * @param cloudProjectNumber The cloud project number.
 * @return A Promise that is fulfilled if the integrity token provider is prepared successfully.
 * @platform android
 */
export declare function prepareIntegrityTokenProviderAsync(cloudProjectNumber: string): Promise<void>;
/**
 * Requests an integrity verdict for the given request hash from Google Play.
 * @param requestHash A string representing the request hash.
 * @return A Promise that is fulfilled with a string that contains the integrity check result.
 * @platform android
 */
export declare function requestIntegrityCheckAsync(requestHash: string): Promise<string>;
/**
 * Checks if hardware attestation is supported on this device.
 * @return A Promise that is fulfilled with a boolean indicating support.
 * @platform android
 */
export declare function isHardwareAttestationSupportedAsync(): Promise<boolean>;
/**
 * Generates a hardware-attested key pair in the Android Keystore.
 * This key can be used for attestation on GrapheneOS and other secure Android distributions.
 * @param keyAlias A unique identifier for the key.
 * @param challenge A challenge string from your server.
 * @return A Promise that resolves when the key is generated successfully.
 * @platform android
 */
export declare function generateHardwareAttestedKeyAsync(keyAlias: string, challenge: string): Promise<void>;
/**
 * Retrieves the attestation certificate chain for a hardware-attested key.
 * The certificate chain can be validated on your server to verify device integrity.
 * @param keyAlias The identifier of the key to get certificates for.
 * @return A Promise that is fulfilled with an array of base64-encoded X.509 certificates.
 * @platform android
 */
export declare function getAttestationCertificateChainAsync(keyAlias: string): Promise<string[]>;
//# sourceMappingURL=AppIntegrity.d.ts.map
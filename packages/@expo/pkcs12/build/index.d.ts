/// <reference types="node" />
import forge from 'node-forge';
/**
 * Returns the serial number of the given X.509 certificate as an uppercased hexadecimal string
 */
export declare function getFormattedSerialNumber(certificate: forge.pki.Certificate): string | null;
/**
 * Extracts a certificate from PKCS#12
 * This is assumed to be a conventional PKCS#12 where there is exactly one certificate and one key
 */
export declare function getX509Certificate(p12: forge.pkcs12.Pkcs12Pfx): forge.pki.Certificate;
/**
 * Extracts a certificate from PKCS#12
 * This is assumed to be a PKCS#12 containing a keystore where the friendlyName (alias) contains a PrivateKeyEntry
 * A PrivateKeyEntry contains exactly one certificate and one key
 * https://docs.oracle.com/javase/7/docs/api/java/security/KeyStore.PrivateKeyEntry.html
 */
export declare function getX509CertificateByFriendlyName(p12: forge.pkcs12.Pkcs12Pfx, friendlyName: string): forge.pki.Certificate | null;
export declare function getX509Asn1ByFriendlyName(p12: forge.pkcs12.Pkcs12Pfx, friendlyName: string): forge.asn1.Asn1 | null;
export declare function parsePKCS12(p12BufferOrBase64String: Buffer | string, maybePassword: string | null): forge.pkcs12.Pkcs12Pfx;
export declare function getAsn1Hash(asn1: forge.asn1.Asn1, { hashAlgorithm, }: {
    hashAlgorithm?: string;
}): string;
export declare function getCertificateFingerprint(certificate: forge.pki.Certificate, { hashAlgorithm, }: {
    hashAlgorithm?: string;
}): string;

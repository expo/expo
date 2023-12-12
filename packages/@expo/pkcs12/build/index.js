"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificateFingerprint = exports.getAsn1Hash = exports.parsePKCS12 = exports.getX509Asn1ByFriendlyName = exports.getX509CertificateByFriendlyName = exports.getX509Certificate = exports.getFormattedSerialNumber = void 0;
const crypto_1 = __importDefault(require("crypto"));
const node_forge_1 = __importDefault(require("node-forge"));
/**
 * Returns the serial number of the given X.509 certificate as an uppercased hexadecimal string
 */
function getFormattedSerialNumber(certificate) {
    const { serialNumber } = certificate;
    return serialNumber ? serialNumber.replace(/^0+/, '').toUpperCase() : null;
}
exports.getFormattedSerialNumber = getFormattedSerialNumber;
/**
 * Extracts a certificate from PKCS#12
 * This is assumed to be a conventional PKCS#12 where there is exactly one certificate and one key
 */
function getX509Certificate(p12) {
    const certBagType = node_forge_1.default.pki.oids.certBag;
    const bags = p12.getBags({ bagType: certBagType })[certBagType];
    if (!bags || bags.length === 0) {
        throw new Error(`PKCS12: No certificates found`);
    }
    return getX509CertificateFromBag(bags[0]);
}
exports.getX509Certificate = getX509Certificate;
/**
 * Extracts a certificate from PKCS#12
 * This is assumed to be a PKCS#12 containing a keystore where the friendlyName (alias) contains a PrivateKeyEntry
 * A PrivateKeyEntry contains exactly one certificate and one key
 * https://docs.oracle.com/javase/7/docs/api/java/security/KeyStore.PrivateKeyEntry.html
 */
function getX509CertificateByFriendlyName(p12, friendlyName) {
    const certBagType = node_forge_1.default.pki.oids.certBag;
    // node-forge converts friendly names to lowercase, so we search by lowercase
    const bags = p12.getBags({
        friendlyName: friendlyName.toLowerCase(),
        bagType: certBagType,
    }).friendlyName;
    if (!bags || bags.length === 0) {
        return null;
    }
    return getX509CertificateFromBag(bags[0]);
}
exports.getX509CertificateByFriendlyName = getX509CertificateByFriendlyName;
function getX509CertificateFromBag(bag) {
    const { cert, asn1 } = bag;
    if (!cert && asn1) {
        // if asn1 is present but certificate isnt, the certificate type was unknown
        // github.com/digitalbazaar/forge/blob/1887cfce43a8f5ca9cb5c256168cf12ce1715ecf/lib/pkcs12.js#L703
        throw new Error('PKCS12: unknown X.509 certificate type');
    }
    if (!cert) {
        throw new Error('PKCS12: bag is not a certificate');
    }
    return cert;
}
function getX509Asn1ByFriendlyName(p12, friendlyName) {
    const certBagType = node_forge_1.default.pki.oids.certBag;
    // node-forge converts friendly names to lowercase, so we search by lowercase
    const bags = p12.getBags({
        friendlyName: friendlyName.toLowerCase(),
        bagType: certBagType,
    }).friendlyName;
    if (!bags || bags.length === 0) {
        return null;
    }
    const { cert, asn1 } = bags[0];
    if (cert) {
        return node_forge_1.default.pki.certificateToAsn1(cert);
    }
    // if asn1 is present but certificate isnt, the certificate type was unknown
    // github.com/digitalbazaar/forge/blob/1887cfce43a8f5ca9cb5c256168cf12ce1715ecf/lib/pkcs12.js#L703
    return asn1 ?? null;
}
exports.getX509Asn1ByFriendlyName = getX509Asn1ByFriendlyName;
function parsePKCS12(p12BufferOrBase64String, maybePassword) {
    const base64EncodedP12 = Buffer.isBuffer(p12BufferOrBase64String)
        ? p12BufferOrBase64String.toString('base64')
        : p12BufferOrBase64String;
    const password = String(maybePassword ?? '');
    const p12Der = node_forge_1.default.util.decode64(base64EncodedP12);
    const p12Asn1 = node_forge_1.default.asn1.fromDer(p12Der);
    return node_forge_1.default.pkcs12.pkcs12FromAsn1(p12Asn1, password);
}
exports.parsePKCS12 = parsePKCS12;
function getHash(data, { hashAlgorithm, hashEncoding, inputEncoding, }) {
    const hash = crypto_1.default.createHash(hashAlgorithm ?? 'sha1');
    if (inputEncoding) {
        hash.update(data, inputEncoding);
    }
    else {
        hash.update(data); // use Node's default inputEncoding
    }
    return hash.digest(hashEncoding ?? 'hex');
}
function getAsn1Hash(asn1, { hashAlgorithm, }) {
    const certDer = node_forge_1.default.asn1.toDer(asn1).getBytes(); // binary encoded string
    return getHash(certDer, {
        hashAlgorithm,
        hashEncoding: 'hex',
        inputEncoding: 'latin1', // latin1 is an alias for binary
    });
}
exports.getAsn1Hash = getAsn1Hash;
function getCertificateFingerprint(certificate, { hashAlgorithm, }) {
    const certAsn1 = node_forge_1.default.pki.certificateToAsn1(certificate);
    return getAsn1Hash(certAsn1, {
        hashAlgorithm,
    });
}
exports.getCertificateFingerprint = getCertificateFingerprint;
//# sourceMappingURL=index.js.map
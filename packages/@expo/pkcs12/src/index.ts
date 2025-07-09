import crypto, { BinaryToTextEncoding, Encoding } from 'crypto';
import forge from 'node-forge';

/**
 * Returns the serial number of the given X.509 certificate as an uppercased hexadecimal string
 */
export function getFormattedSerialNumber(certificate: forge.pki.Certificate): string | null {
  const { serialNumber } = certificate;
  return serialNumber ? serialNumber.replace(/^0+/, '').toUpperCase() : null;
}

/**
 * Extracts a certificate from PKCS#12
 * This is assumed to be a conventional PKCS#12 where there is exactly one certificate and one key
 */
export function getX509Certificate(p12: forge.pkcs12.Pkcs12Pfx): forge.pki.Certificate {
  const certBagType = forge.pki.oids.certBag;
  const bags = p12.getBags({ bagType: certBagType })[certBagType];
  if (!bags || bags.length === 0) {
    throw new Error(`PKCS12: No certificates found`);
  }
  return getX509CertificateFromBag(bags[0]);
}

/**
 * Extracts a certificate from PKCS#12
 * This is assumed to be a PKCS#12 containing a keystore where the friendlyName (alias) contains a PrivateKeyEntry
 * A PrivateKeyEntry contains exactly one certificate and one key
 * https://docs.oracle.com/javase/7/docs/api/java/security/KeyStore.PrivateKeyEntry.html
 */
export function getX509CertificateByFriendlyName(
  p12: forge.pkcs12.Pkcs12Pfx,
  friendlyName: string
): forge.pki.Certificate | null {
  const certBagType = forge.pki.oids.certBag;
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

function getX509CertificateFromBag(bag: forge.pkcs12.Bag): forge.pki.Certificate {
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

export function getX509Asn1ByFriendlyName(
  p12: forge.pkcs12.Pkcs12Pfx,
  friendlyName: string
): forge.asn1.Asn1 | null {
  const certBagType = forge.pki.oids.certBag;
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
    return forge.pki.certificateToAsn1(cert);
  }
  // if asn1 is present but certificate isnt, the certificate type was unknown
  // github.com/digitalbazaar/forge/blob/1887cfce43a8f5ca9cb5c256168cf12ce1715ecf/lib/pkcs12.js#L703
  return asn1 ?? null;
}

export function parsePKCS12(
  p12BufferOrBase64String: Buffer | string,
  maybePassword: string | null
): forge.pkcs12.Pkcs12Pfx {
  const base64EncodedP12 = Buffer.isBuffer(p12BufferOrBase64String)
    ? p12BufferOrBase64String.toString('base64')
    : p12BufferOrBase64String;
  const password = String(maybePassword ?? '');
  const p12Der = forge.util.decode64(base64EncodedP12);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  return forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
}

function getHash(
  data: string,
  {
    hashAlgorithm,
    hashEncoding,
    inputEncoding,
  }: {
    hashAlgorithm?: string;
    hashEncoding?: BinaryToTextEncoding;
    inputEncoding?: Encoding;
  }
): string {
  const hash = crypto.createHash(hashAlgorithm ?? 'sha1');
  if (inputEncoding) {
    hash.update(data, inputEncoding);
  } else {
    hash.update(data); // use Node's default inputEncoding
  }
  return hash.digest(hashEncoding ?? 'hex');
}

export function getAsn1Hash(
  asn1: forge.asn1.Asn1,
  {
    hashAlgorithm,
  }: {
    hashAlgorithm?: string;
  }
): string {
  const certDer = forge.asn1.toDer(asn1).getBytes(); // binary encoded string
  return getHash(certDer, {
    hashAlgorithm,
    hashEncoding: 'hex',
    inputEncoding: 'latin1', // latin1 is an alias for binary
  });
}

export function getCertificateFingerprint(
  certificate: forge.pki.Certificate,
  {
    hashAlgorithm,
  }: {
    hashAlgorithm?: string;
  }
): string {
  const certAsn1 = forge.pki.certificateToAsn1(certificate);
  return getAsn1Hash(certAsn1, {
    hashAlgorithm,
  });
}

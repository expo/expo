import { EncryptedContentInfo } from '@peculiar/asn1-cms';
import { AsnParser, AsnProp, AsnPropTypes } from '@peculiar/asn1-schema';
import { AlgorithmIdentifier } from '@peculiar/asn1-x509';
import { fromBER } from 'asn1js';

/** Encrypted bytes can look like nested ASN.1 */
export const berOptions = {
  maxDepth: 64,
  maxNodes: 10000,
  maxContentLength: 16 * 1024 * 1024,
  parseEmbedded: false,
};

/** Trailing bytes must not bypass validation */
export function decode(data: Buffer | ArrayBuffer) {
  const bytes = Buffer.isBuffer(data) ? Buffer.from(data) : Buffer.from(new Uint8Array(data));
  if (bytes.length > berOptions.maxContentLength) {
    throw new Error('PKCS12: container exceeds the 16 MiB parsing limit');
  }

  let parsed: ReturnType<typeof fromBER>;
  try {
    parsed = fromBER(bytes, berOptions);
  } catch (error) {
    throw new Error(
      `PKCS12: invalid ASN.1 data: ${error instanceof Error ? error.message : error}`
    );
  }

  if (parsed.offset !== bytes.length || parsed.result.error) {
    throw new Error(`PKCS12: invalid ASN.1 data: ${parsed.result.error || 'trailing bytes'}`);
  }
  return parsed.result;
}

/** Uses {@link decode} for input limits */
export function parse<T>(data: Buffer | ArrayBuffer, target: new () => T): T {
  return AsnParser.fromASN(decode(data), target, { berOptions });
}

/** Supplies the wrapper absent from the CMS package */
export class EncryptedData {
  version = 0;
  encryptedContentInfo = new EncryptedContentInfo();
}

// Direct registration avoids compiler decorator settings
AsnProp({ type: AsnPropTypes.Integer })(EncryptedData.prototype, 'version');
AsnProp({ type: EncryptedContentInfo })(EncryptedData.prototype, 'encryptedContentInfo');

/** These ciphers use salt and iterations rather than PBKDF2 */
export class PBEParameters {
  salt = new ArrayBuffer(0);
  iterations = 0;
}

AsnProp({ type: AsnPropTypes.OctetString })(PBEParameters.prototype, 'salt');
AsnProp({ type: AsnPropTypes.Integer })(PBEParameters.prototype, 'iterations');

/** The KDF and cipher each need their own parameters */
export class PBES2Parameters {
  keyDerivationFunc = new AlgorithmIdentifier();
  encryptionScheme = new AlgorithmIdentifier();
}

AsnProp({ type: AlgorithmIdentifier })(PBES2Parameters.prototype, 'keyDerivationFunc');
AsnProp({ type: AlgorithmIdentifier })(PBES2Parameters.prototype, 'encryptionScheme');

/** Missing PRF parameters must select HMAC-SHA1 */
export class PBKDF2Parameters {
  salt = new ArrayBuffer(0);
  iterationCount = 0;
  /** Uses bytes to match cipher key lengths */
  keyLength?: number;
  prf = new AlgorithmIdentifier({ algorithm: '1.2.840.113549.2.7' });
}

AsnProp({ type: AsnPropTypes.OctetString })(PBKDF2Parameters.prototype, 'salt');
AsnProp({ type: AsnPropTypes.Integer })(PBKDF2Parameters.prototype, 'iterationCount');
AsnProp({ type: AsnPropTypes.Integer, optional: true })(PBKDF2Parameters.prototype, 'keyLength');
AsnProp({ type: AlgorithmIdentifier, optional: true })(PBKDF2Parameters.prototype, 'prf');

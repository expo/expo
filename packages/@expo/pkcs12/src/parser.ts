import type { PKCS12Attribute } from '@peculiar/asn1-pfx';
import { AuthenticatedSafe, CertBag, PFX, SafeContents } from '@peculiar/asn1-pfx';
import { EncryptedPrivateKeyInfo, PrivateKeyInfo } from '@peculiar/asn1-pkcs8';
import { AsnParser } from '@peculiar/asn1-schema';
import type { AlgorithmIdentifier } from '@peculiar/asn1-x509';
import { BmpString, OctetString, Sequence } from 'asn1js';

import { checkLegacyCipher, decrypt, DecryptionError, KdfBudget, verifyMac } from './crypto';
import { berOptions, decode, EncryptedData, parse } from './schema';

const certBagId = '1.2.840.113549.1.12.10.1.3';
const dataId = '1.2.840.113549.1.7.1';
const attributeNames: Record<string, string> = {
  '1.2.840.113549.1.9.20': 'friendlyName',
  '1.2.840.113549.1.9.21': 'localKeyId',
};

export type CertificateData = {
  readonly certificate: string;
  readonly attributes: Readonly<Record<string, readonly string[]>>;
};

function octets(data: ArrayBuffer): Buffer {
  const value = decode(data);
  if (!(value instanceof OctetString)) throw new Error('PKCS12: expected an OCTET STRING');
  return Buffer.from(value.getValue());
}

function readAttributes(attributes: PKCS12Attribute[] = []): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const attribute of attributes) {
    const name = attributeNames[attribute.attrId];
    if (!name) continue;
    result[name] = attribute.attrValues.map((value) => {
      const node = decode(value);
      if (name === 'friendlyName') {
        if (!(node instanceof BmpString)) throw new Error('PKCS12: invalid friendlyName');
        return node.valueBlock.value;
      }
      if (!(node instanceof OctetString)) throw new Error('PKCS12: invalid bag attribute');
      return Buffer.from(node.getValue()).toString('latin1');
    });
  }
  return result;
}

function readEncryptedSafe(content: ArrayBuffer) {
  const data = parse(content, EncryptedData);
  const info = data.encryptedContentInfo;
  if (data.version !== 0 || info.contentType !== dataId || !info.encryptedContent) {
    throw new Error('PKCS12: invalid encrypted safe contents');
  }
  const encrypted = info.encryptedContent.value
    ? Buffer.from(info.encryptedContent.value.buffer)
    : Buffer.concat(
        (info.encryptedContent.constructedValue ?? []).map((value) => Buffer.from(value.buffer))
      );
  return { algorithm: info.contentEncryptionAlgorithm, bytes: encrypted };
}

export async function parseCertificates(
  bytes: Buffer,
  password: string
): Promise<CertificateData[]> {
  const budget = new KdfBudget();
  const encoded = decode(bytes);
  if (!(encoded instanceof Sequence) || ![2, 3].includes(encoded.valueBlock.value.length)) {
    throw new Error('ASN.1 object is not an PKCS#12 PFX');
  }
  const pfx = AsnParser.fromASN(encoded, PFX, { berOptions });
  if (pfx.version !== 3 || pfx.authSafe.contentType !== dataId) {
    throw new Error('ASN.1 object is not an PKCS#12 PFX with password integrity');
  }
  const authenticatedBytes = octets(pfx.authSafe.content);
  // Detect unavailable ciphers before MAC and key derivation
  const contents = parse(authenticatedBytes, AuthenticatedSafe).map((safe) => {
    if (safe.contentType === dataId) {
      return { algorithm: null, bytes: octets(safe.content) };
    }
    if (safe.contentType !== '1.2.840.113549.1.7.6') {
      throw new Error(`PKCS12: unsupported safe content type ${safe.contentType}`);
    }
    const encrypted = readEncryptedSafe(safe.content);
    checkLegacyCipher(encrypted.algorithm.algorithm);
    return encrypted;
  });
  // The schema supplies MacData for containers without a MAC
  if (encoded.valueBlock.value.length === 3) {
    await verifyMac(authenticatedBytes, pfx.macData, password, budget);
  }
  const decryptContents = async <T>(
    algorithm: AlgorithmIdentifier,
    encrypted: Buffer,
    target: new () => T,
    failureMessage: string
  ): Promise<Buffer> => {
    try {
      return await decrypt(algorithm, encrypted, password, budget, (plaintext) =>
        parse(plaintext, target)
      );
    } catch (error) {
      if (error instanceof DecryptionError) throw new Error(failureMessage);
      throw error;
    }
  };
  const result: CertificateData[] = [];
  let totalBags = 0;
  const readSafe = async (safeBytes: Buffer, depth: number): Promise<void> => {
    if (depth > 16) throw new Error('PKCS12: nested safe contents exceed the parsing limit');
    for (const bag of parse(safeBytes, SafeContents)) {
      if (++totalBags > 10000) throw new Error('PKCS12: too many bags');
      const attributes = readAttributes(bag.bagAttributes);
      switch (bag.bagId) {
        case '1.2.840.113549.1.12.10.1.1':
          parse(bag.bagValue, PrivateKeyInfo);
          break;
        case '1.2.840.113549.1.12.10.1.2': {
          const info = parse(bag.bagValue, EncryptedPrivateKeyInfo);
          await decryptContents(
            info.encryptionAlgorithm,
            Buffer.from(info.encryptedData.buffer),
            PrivateKeyInfo,
            'Unable to decrypt PKCS#8 ShroudedKeyBag, wrong password?'
          );
          break;
        }
        case certBagId: {
          const cert = parse(bag.bagValue, CertBag);
          if (cert.certId !== '1.2.840.113549.1.9.22.1') {
            throw new Error('PKCS12: unsupported certificate bag type');
          }
          const der = octets(cert.certValue);
          decode(der);
          result.push({ certificate: der.toString('base64'), attributes });
          break;
        }
        case '1.2.840.113549.1.12.10.1.6':
          await readSafe(Buffer.from(bag.bagValue), depth + 1);
          break;
        default:
          throw new Error(`PKCS12: unsupported bag type ${bag.bagId}`);
      }
    }
  };
  for (const { algorithm, bytes } of contents) {
    const plaintext = algorithm
      ? await decryptContents(
          algorithm,
          bytes,
          SafeContents,
          'Failed to decrypt PKCS#12 SafeContents. Check the password and container.'
        )
      : bytes;
    await readSafe(plaintext, 0);
  }
  return result;
}

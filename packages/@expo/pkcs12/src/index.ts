import { AsnParser } from '@peculiar/asn1-schema';
import { Certificate as CertificateSchema } from '@peculiar/asn1-x509';
import { Null, Sequence } from 'asn1js';
import { createHash } from 'crypto';

import { Certificate } from './certificate';
import { LegacyProviderRequired } from './crypto';
import type { CertificateData } from './parser';
import { parseCertificates } from './parser';
import { berOptions, decode } from './schema';
import { parseInSubprocess, parseInSubprocessSync } from './subprocess';

export { X509Certificate } from 'crypto';
export { Certificate, DistinguishedName } from './certificate';
export type { CertificateAttribute } from './certificate';

export type Pkcs12Pfx = readonly CertificateData[];

function immutableCertificates(certificates: CertificateData[]): Pkcs12Pfx {
  for (const entry of certificates) {
    for (const values of Object.values(entry.attributes)) Object.freeze(values);
    Object.freeze(entry.attributes);
    Object.freeze(entry);
  }
  return Object.freeze(certificates);
}

function inputBytes(input: Buffer | string): Buffer {
  const bytes = Buffer.isBuffer(input) ? Buffer.from(input) : Buffer.from(input, 'base64');
  if (bytes.length > berOptions.maxContentLength) {
    throw new Error('PKCS12: container exceeds the 16 MiB parsing limit');
  }
  return bytes;
}

/** A valid MAC does not verify encrypted private keys */
export async function parsePKCS12Async(
  input: Buffer | string,
  password: string | null
): Promise<Pkcs12Pfx> {
  const bytes = inputBytes(input);
  const normalizedPassword = String(password ?? '');
  let certificates: CertificateData[];
  try {
    certificates = await parseCertificates(bytes, normalizedPassword);
  } catch (error) {
    if (!(error instanceof LegacyProviderRequired)) throw error;
    certificates = await parseInSubprocess(bytes, normalizedPassword);
  }
  return immutableCertificates(certificates);
}

/** @deprecated Use parsePKCS12Async to avoid blocking the caller */
export function parsePKCS12(input: Buffer | string, password: string | null): Pkcs12Pfx {
  return immutableCertificates(parseInSubprocessSync(inputBytes(input), String(password ?? '')));
}

/** Returns uppercase hexadecimal without leading zeroes */
export function getFormattedSerialNumber(certificate: { serialNumber: string }): string | null {
  return certificate.serialNumber
    ? certificate.serialNumber.replace(/^0+/, '').toUpperCase()
    : null;
}

function certificateFromDer(der: Buffer): Certificate {
  try {
    const certificate = new Certificate(der);
    if (certificate.publicKey.asymmetricKeyType === 'rsa') return certificate;
  } catch {
    // DER access does not require native support for the key algorithm
  }
  throw new Error('PKCS12: unknown X.509 certificate type');
}

/** Extracts the first certificate from a conventional PKCS12 container */
export function getX509Certificate(p12: Pkcs12Pfx): Certificate {
  const entry = p12[0];
  if (!entry) throw new Error('PKCS12: No certificates found');
  return certificateFromDer(Buffer.from(entry.certificate, 'base64'));
}

export function getCertificateDerByFriendlyName(
  p12: Pkcs12Pfx,
  friendlyName: string
): Buffer | null {
  const entry = p12.find((entry) =>
    entry.attributes.friendlyName?.includes(friendlyName.toLowerCase())
  );
  return entry ? Buffer.from(entry.certificate, 'base64') : null;
}

export function getX509CertificateByFriendlyName(
  p12: Pkcs12Pfx,
  friendlyName: string
): Certificate | null {
  const der = getCertificateDerByFriendlyName(p12, friendlyName);
  return der ? certificateFromDer(der) : null;
}

export function getCertificateFingerprint(
  certificate: Pick<Certificate, 'raw'> | Buffer,
  { hashAlgorithm }: { hashAlgorithm?: string }
): string {
  let der = Buffer.isBuffer(certificate) ? certificate : certificate.raw;
  const node = decode(der);
  const parsed = AsnParser.fromASN(node, CertificateSchema, { berOptions });
  if (parsed.tbsCertificate.subjectPublicKeyInfo.algorithm.algorithm === '1.2.840.113549.1.1.1') {
    const algorithm = (node as Sequence).valueBlock.value[1];
    // NULL and omitted parameters must give the same fingerprint
    if (algorithm instanceof Sequence && algorithm.valueBlock.value.length === 1) {
      algorithm.valueBlock.value.push(new Null());
      der = Buffer.from(node.toBER());
    }
  }
  return createHash(hashAlgorithm ?? 'sha1')
    .update(der)
    .digest('hex');
}

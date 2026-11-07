import { Certificate as CertificateSchema } from '@peculiar/asn1-x509';
import type { Name } from '@peculiar/asn1-x509';
import { X509Certificate } from 'crypto';

import { parse } from './schema';

const attributeNames: Record<string, [string, string]> = {
  '2.5.4.3': ['CN', 'commonName'],
  '2.5.4.6': ['C', 'countryName'],
  '2.5.4.7': ['L', 'localityName'],
  '2.5.4.8': ['ST', 'stateOrProvinceName'],
  '2.5.4.10': ['O', 'organizationName'],
  '2.5.4.11': ['OU', 'organizationalUnitName'],
  '1.2.840.113549.1.9.1': ['E', 'emailAddress'],
};

export type CertificateAttribute = {
  type: string;
  value: string;
  shortName?: string;
  name?: string;
};

export class DistinguishedName {
  readonly #attributes: CertificateAttribute[];

  constructor(name: Name) {
    this.#attributes = Array.from(name).flatMap((rdn) =>
      rdn.map(({ type, value }) => {
        const names = attributeNames[type];
        return {
          type,
          value: value.toString(),
          ...(names ? { shortName: names[0], name: names[1] } : {}),
        };
      })
    );
  }

  get attributes(): CertificateAttribute[] {
    return this.#attributes.map((attribute) => ({ ...attribute }));
  }

  getField(field: string): CertificateAttribute | undefined {
    const attribute = this.#attributes.find(
      (value) => value.type === field || value.shortName === field || value.name === field
    );
    return attribute ? { ...attribute } : undefined;
  }
}

function certificateDate(date: Date | undefined, text: string): number {
  const parsed = new Date(date ?? text);
  if (!date) {
    // Date's parser maps years 0–99 to other centuries
    const year = Number(text.trim().split(/\s+/).at(-2));
    if (!Number.isInteger(year)) throw new Error('PKCS12: invalid certificate validity date');
    parsed.setUTCFullYear(year);
    parsed.setUTCMilliseconds(0);
  }
  if (!Number.isFinite(parsed.getTime()))
    throw new Error('PKCS12: invalid certificate validity date');
  return parsed.getTime();
}

/** Copies protect the parsed certificate from caller mutations */
export class Certificate {
  readonly #der: Buffer;
  readonly #native: X509Certificate;
  readonly #notBefore: number;
  readonly #notAfter: number;
  readonly serialNumber: string;
  readonly subject: DistinguishedName;
  readonly issuer: DistinguishedName;

  constructor(der: Uint8Array) {
    this.#der = Buffer.from(der);
    const parsed = parse(this.#der, CertificateSchema).tbsCertificate;
    this.#native = new X509Certificate(this.#der);
    if (!this.#native.raw.equals(this.#der))
      throw new Error('PKCS12: certificate DER was not preserved');
    this.#notBefore = certificateDate(this.#native.validFromDate, this.#native.validFrom);
    this.#notAfter = certificateDate(this.#native.validToDate, this.#native.validTo);
    this.serialNumber = Buffer.from(parsed.serialNumber).toString('hex');
    this.subject = new DistinguishedName(parsed.subject);
    this.issuer = new DistinguishedName(parsed.issuer);
  }

  get validity(): { notBefore: Date; notAfter: Date } {
    return { notBefore: new Date(this.#notBefore), notAfter: new Date(this.#notAfter) };
  }

  get publicKey() {
    return this.#native.publicKey;
  }

  get raw(): Buffer {
    return Buffer.from(this.#der);
  }

  get nativeCertificate(): X509Certificate {
    // Separate instances prevent changes to the stored raw buffer
    return new X509Certificate(this.#der);
  }
}

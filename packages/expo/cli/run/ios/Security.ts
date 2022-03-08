import spawnAsync from '@expo/spawn-async';
import forge from 'node-forge';

import CommandError from '../../../CommandError';

export type CertificateSigningInfo = {
  /**
   * @example 'AA00AABB0A'
   */
  signingCertificateId: string;
  /**
   * @example 'Apple Development: Evan Bacon (AA00AABB0A)'
   */
  codeSigningInfo?: string;
  /**
   * @example '650 Industries, Inc.'
   */
  appleTeamName?: string;
  /**
   * @example 'A1BCDEF234'
   */
  appleTeamId?: string;
};

export async function assertInstalledAsync() {
  try {
    await spawnAsync('which', ['security']);
  } catch {
    throw new CommandError(
      "Cannot code sign project because the CLI `security` is not available on your computer.\nPlease ensure it's installed and try again."
    );
  }
}

export async function getCertificateForSigningIdAsync(id: string): Promise<forge.pki.Certificate> {
  const pem = (await spawnAsync('security', ['find-certificate', '-c', id, '-p'])).stdout?.trim?.();
  if (!pem) {
    throw new CommandError(
      `Failed to get PEM certificate for ID "${id}" using the \`security\` CLI`
    );
  }
  return forge.pki.certificateFromPem(pem);
}

export async function findIdentitiesAsync(): Promise<string[]> {
  const results = (
    await spawnAsync('security', ['find-identity', '-p', 'codesigning', '-v'])
  ).stdout.trim?.();
  // Returns a string like:
  // 1) 12222234253761286351826735HGKDHAJGF45283 "Apple Development: Evan Bacon (AA00AABB0A)" (CSSMERR_TP_CERT_REVOKED)
  // 2) 12312234253761286351826735HGKDHAJGF45283 "Apple Development: bacon@expo.io (BB00AABB0A)"
  // 3) 12442234253761286351826735HGKDHAJGF45283 "iPhone Distribution: Evan Bacon (CC00AABB0B)" (CSSMERR_TP_CERT_REVOKED)
  // 4) 15672234253761286351826735HGKDHAJGF45283 "Apple Development: Evan Bacon (AA00AABB0A)"
  //  4 valid identities found

  const parsed = results
    .split('\n')
    .map(line => extractCodeSigningInfo(line))
    .filter(Boolean) as string[];

  // Remove duplicates
  return [...new Set(parsed)];
}

/**
 * @param value '  2) 12312234253761286351826735HGKDHAJGF45283 "Apple Development: bacon@expo.io (BB00AABB0A)"'
 * @returns 'Apple Development: Evan Bacon (PH75MDXG4H)'
 */
export function extractCodeSigningInfo(value: string): string | null {
  return value.match(/^\s*\d+\).+"(.+Develop(ment|er).+)"$/)?.[1] ?? null;
}

export async function resolveIdentitiesAsync(
  identities: string[]
): Promise<CertificateSigningInfo[]> {
  const values = identities.map(extractSigningId).filter(Boolean) as string[];
  return await Promise.all(
    values.map(signingCertificateId => resolveCertificateSigningInfoAsync(signingCertificateId))
  );
}

export async function resolveCertificateSigningInfoAsync(
  signingCertificateId: string
): Promise<CertificateSigningInfo> {
  const certificate = await getCertificateForSigningIdAsync(signingCertificateId);
  return {
    signingCertificateId,
    codeSigningInfo: certificate.subject.getField('CN')?.value,
    appleTeamName: certificate.subject.getField('O')?.value,
    appleTeamId: certificate.subject.getField('OU')?.value,
  };
}

/**
 * @param codeSigningInfo 'Apple Development: Evan Bacon (AA00AABB0A)'
 * @returns 'AA00AABB0A'
 */
export function extractSigningId(codeSigningInfo: string): string | null {
  return codeSigningInfo.match(/.*\(([a-zA-Z0-9]+)\)/)?.[1] ?? null;
}

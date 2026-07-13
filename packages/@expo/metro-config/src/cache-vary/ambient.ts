import crypto from 'node:crypto';

export type AmbientVaryScheme = 'env';

export function isAmbientVaryScheme(scheme: string): scheme is AmbientVaryScheme {
  return scheme === 'env';
}

// Duplicated in `@expo/cli`; keep this function, `dimId`, and `canonicalDimNames` in sync.
export function readAmbientVaryValue(scheme: AmbientVaryScheme, name: string): string | undefined {
  switch (scheme) {
    case 'env':
      return process.env[name];
  }
}

export type CacheVaryDim = { scheme: string; name: string };

export interface EmbeddedVaryDim extends CacheVaryDim {
  fp: string;
}

export async function currentFingerprint(scheme: string, name: string): Promise<string | null> {
  if (!isAmbientVaryScheme(scheme)) return null;
  return sha1(fingerprintInput(readAmbientVaryValue(scheme, name)));
}

export const dimId = (dim: CacheVaryDim): string => `${dim.scheme}:${dim.name}`;

export function canonicalDimNames(dims: readonly CacheVaryDim[]): string {
  return dims.map(dimId).sort().join('\n');
}

export function canonicalDims(dims: readonly EmbeddedVaryDim[]): string {
  return dims
    .map((d) => `${dimId(d)}=${d.fp}`)
    .sort()
    .join('\n');
}

function sha1(value: string): string {
  return crypto.createHash('sha1').update(value).digest('hex');
}

function fingerprintInput(value: string | undefined): string {
  // JSON framing separates unset from empty.
  return value === undefined ? '' : JSON.stringify(value);
}

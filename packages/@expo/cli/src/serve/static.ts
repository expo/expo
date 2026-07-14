import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

import type { StaticManifest } from '../export/static';

export async function loadStaticManifestAsync(
  dist: string
): Promise<StaticManifest<RegExp> | null> {
  let json: StaticManifest<string>;
  try {
    json = JSON.parse(await fs.readFile(path.join(dist, '_expo/.routes.json'), 'utf8'));
  } catch {
    return null;
  }

  return {
    ...json,
    redirects: json.redirects?.map((rule) => ({
      ...rule,
      namedRegex: new RegExp(rule.namedRegex),
    })),
  };
}

/**
 * Applies headers from a static export manifest to a response, except
 * `Content-Type` which must come from the served file.
 */
export function applyStaticHeaders(
  res: http.ServerResponse,
  headers: Record<string, string | string[]>
): void {
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === 'content-type') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const headerValue of value) {
        res.appendHeader(name, headerValue);
      }
    } else if (!res.hasHeader(name)) {
      res.setHeader(name, value);
    }
  }
}

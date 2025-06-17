/**
 * Copyright © 2025 650 Industries.
 */
const browserslistCache: Record<string, import('lightningcss').Targets> = {};

export async function getBrowserslistTargets(
  projectRoot: string
): Promise<import('lightningcss').Targets> {
  if (browserslistCache[projectRoot]) {
    return browserslistCache[projectRoot];
  }
  const browserslist = await import('browserslist');
  const { browserslistToTargets } = require('lightningcss') as typeof import('lightningcss');

  const targets = browserslistToTargets(
    browserslist.default(undefined, {
      throwOnMissing: false,
      ignoreUnknownVersions: true,
      path: projectRoot,
    })
  );

  browserslistCache[projectRoot] = targets;
  return targets;
}

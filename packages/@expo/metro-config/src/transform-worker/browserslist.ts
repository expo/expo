/**
 * Copyright © 2025 650 Industries.
 */

const debug = require('debug')('expo:metro:browserslist') as typeof console.log;

const browserslistCache: Record<string, import('lightningcss').Targets> = {};

export async function getBrowserslistTargets(
  projectRoot: string
): Promise<import('lightningcss').Targets> {
  if (browserslistCache[projectRoot]) {
    return browserslistCache[projectRoot];
  }
  const browserslist = await import('browserslist');
  const { browserslistToTargets } = await import('lightningcss');

  const targets = browserslistToTargets(
    browserslist.default(undefined, {
      throwOnMissing: false,
      ignoreUnknownVersions: true,
      path: projectRoot,
    })
  );

  debug('Browserslist targets: %O', targets);
  browserslistCache[projectRoot] = targets;
  return targets;
}

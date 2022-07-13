import G, { Glob } from 'glob';

/** Finds all matching files. */
export function everyMatchAsync(pattern: string, options: G.IOptions) {
  return new Promise<string[]>((resolve, reject) => {
    const g = new Glob(pattern, options);
    let called = false;
    const callback = (er: Error | null, matched: string[]) => {
      if (called) return;
      called = true;
      if (er) reject(er);
      else resolve(matched);
    };
    g.on('error', callback);
    g.on('end', (matches) => callback(null, matches));
  });
}

/** Bails out early after finding the first matching file. */
export function anyMatchAsync(pattern: string, options: G.IOptions) {
  return new Promise<string[]>((resolve, reject) => {
    const g = new Glob(pattern, options);
    let called = false;
    const callback = (er: Error | null, matched: string[]) => {
      if (called) return;
      called = true;
      if (er) reject(er);
      else resolve(matched);
    };
    g.on('error', callback);
    g.on('match', (matched) => {
      // We've disabled using abort as it breaks the entire glob package across all instances.
      // https://github.com/isaacs/node-glob/issues/279 & https://github.com/isaacs/node-glob/issues/342
      // For now, just collect every match.
      // g.abort();
      callback(null, [matched]);
    });
    g.on('end', (matches) => callback(null, matches));
  });
}

/**
 * Wait some time, then escape...
 * Adding this because glob can sometimes freeze and fail to resolve if any other glob uses `.abort()`.
 */
export function wrapGlobWithTimeout(
  query: () => Promise<string[]>,
  duration: number
): Promise<string[] | false> {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, duration);

    process.on('SIGINT', () => clearTimeout(timeout));

    try {
      resolve(await query());
    } catch (error) {
      reject(error);
    } finally {
      clearTimeout(timeout);
    }
  });
}

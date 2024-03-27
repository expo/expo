import glob, { Options } from 'fast-glob';

/** Bails out early after finding the first matching file. */
export async function anyMatchAsync(pattern: string, options: Options) {
  const stream = glob.stream(pattern, options);
  for await (const file of stream) {
    return [file.toString('utf8')];
  }
  return [];
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

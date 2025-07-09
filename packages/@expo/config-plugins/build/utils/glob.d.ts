/**
 * Sort the glob result alphabetically, to ensure results are identical across different devices (Linux/MacOS).
 * Since `glob@9` the results are determined by the OS and not guaranteed to be sorted.
 *
 * @see https://github.com/isaacs/node-glob/issues/576#issuecomment-1972765500
 */
export declare function withSortedGlobResult(glob: string[]): string[];

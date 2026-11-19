/**
 * Normalizes a git URL for comparison (strips trailing .git and lowercases).
 */
export function normalizeGitUrl(url: string): string {
  return url.replace(/\.git$/, '').toLowerCase();
}

/**
 * Derives the package name from an SPM URL.
 * e.g., "https://github.com/airbnb/lottie-spm.git" -> "lottie-spm"
 */
export function derivePackageNameFromUrl(url: string): string {
  const name = url.substring(url.lastIndexOf('/') + 1);
  return name.endsWith('.git') ? name.slice(0, -4) : name;
}

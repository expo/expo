// SPM productName/packageName values from spm.config.json are interpolated
// into filesystem paths and generated Swift source. The JSON schema does not
// constrain their character set, so this validator runs at every boundary to
// reject path separators, "..", NUL, quotes, and shell metacharacters before
// any downstream sink sees them.

const SAFE_SPM_IDENTIFIER = /^[A-Za-z0-9_][A-Za-z0-9_.+-]{0,127}$/;

export function isSafeSPMIdentifier(value: unknown): value is string {
  return typeof value === 'string' && SAFE_SPM_IDENTIFIER.test(value) && !value.includes('..');
}

export function assertSafeSPMIdentifier(
  value: unknown,
  fieldName: string
): asserts value is string {
  if (isSafeSPMIdentifier(value)) {
    return;
  }
  const printable =
    typeof value === 'string'
      ? JSON.stringify(value)
      : `${Object.prototype.toString.call(value)} (${typeof value})`;
  throw new Error(
    `Invalid SPM identifier for ${fieldName}: ${printable}. Must match ` +
      `${SAFE_SPM_IDENTIFIER} with no "..". This value is interpolated into ` +
      `paths and generated Swift source — fix it in spm.config.json.`
  );
}

// Stricter than SAFE_SPM_IDENTIFIER: a framework name is also written as a bare
// Swift `import`, where ".", "+" and "-" are not part of a module name.
const FRAMEWORK_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

function isFrameworkName(entry: unknown): entry is string {
  return typeof entry === 'string' && FRAMEWORK_NAME.test(entry);
}

/**
 * Reads a target's `linkedFrameworks` from spm.config.json, which nothing validates at runtime.
 * A missing value means no frameworks; any other value that is not a list of framework names throws.
 */
export function parseLinkedFrameworks(value: unknown, targetName: string): string[] {
  if (value === undefined) {
    return [];
  }
  if (Array.isArray(value) && value.every(isFrameworkName)) {
    return value;
  }
  const offender = Array.isArray(value) ? value.find((entry) => !isFrameworkName(entry)) : value;
  throw new Error(
    `Cannot read "linkedFrameworks" for target "${targetName}": ${JSON.stringify(offender)} is ` +
      `not ${Array.isArray(value) ? 'a framework name' : 'a list of framework names'}. Each ` +
      `entry is written into the generated Package.swift as .linkedFramework("…") and into ` +
      `Swift source as @_exported import …, so it must be a plain framework name. Write them ` +
      `in the package's spm.config.json as, for example\n` +
      `  "linkedFrameworks": ["UIKit", "AVFoundation"]`
  );
}

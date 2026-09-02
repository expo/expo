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

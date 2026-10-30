import { DigesterFinding } from './Digester';

export function formatAbiFindings(findings: Map<string, DigesterFinding[]>): string {
  const lines: string[] = [];
  for (const [module, moduleFindings] of findings) {
    lines.push(`${module}:`);
    lines.push(...moduleFindings.map((finding) => `  - ${finding.message}`));
    lines.push('');
  }
  return lines.join('\n');
}

export function formatAbiFailure(
  findings: Map<string, DigesterFinding[]>,
  missing: string[]
): string {
  const lines = [
    'Swift ABI check failed: this PR removes or changes declarations in ExpoModulesCore or ExpoModulesJSI that precompiled modules link against.',
    'Apps that use an older precompiled module with this version will crash at launch with "Symbol not found".',
    '',
    formatAbiFindings(findings),
  ];
  lines.push(
    'To fix it, do one of these:',
    '  1. Keep the old declaration (forward it to the new one), so the change is additive.',
    '  2. If the break is necessary, add a changeset with a patch bump for these packages:',
    ...missing.map((name) => `       "${name}": patch`),
    '',
    'If this is a false positive, remove the "check: ABI" label. This check is not required.'
  );
  return lines.join('\n');
}

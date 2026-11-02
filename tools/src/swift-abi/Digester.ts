import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { spawnAsync } from '../Utils';

export type DigesterFinding = { section: string; message: string };

export function parseDigesterReport(report: string): DigesterFinding[] {
  const findings: DigesterFinding[] = [];
  let section = '';
  for (const line of report.split('\n').map((line) => line.trim())) {
    const header = line.match(/^\/\* (.+) \*\/$/);
    if (header) {
      section = header[1];
    } else if (line) {
      findings.push({ section, message: line });
    }
  }
  return findings;
}

export function isBreakingFinding(finding: DigesterFinding): boolean {
  return !finding.message.endsWith("is a new API without '@available'");
}

const REMOVAL_PATTERNS = [
  / has been removed$/,
  / has been renamed to /,
  / has been moved to /,
  / has mangled name changing from /,
  / has removed conformance to /,
];

export function isRemovalFinding(finding: DigesterFinding): boolean {
  return REMOVAL_PATTERNS.some((pattern) => pattern.test(finding.message));
}

export async function runDigesterAsync(baselinePath: string, currentPath: string): Promise<string> {
  const outputDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'swift-abi-'));
  const output = path.join(outputDir, 'report.txt');
  try {
    await spawnAsync('xcrun', [
      'swift-api-digester',
      '-diagnose-sdk',
      '-abi',
      '-input-paths',
      baselinePath,
      '-input-paths',
      currentPath,
      '-o',
      output,
    ]);
    return await fs.promises.readFile(output, 'utf8');
  } finally {
    await fs.promises.rm(outputDir, { recursive: true, force: true });
  }
}

import type { Config } from '@jest/types';
import fs from 'node:fs';
import path from 'node:path';

import { exportSharedDistAsync } from './utils/shared-dist';

const SHARED_DIST_SUITE_MARKER = "app: 'server-tester'";

/** Exports the `server-tester` app once per run so the suites that serve it do not export it again. */
export default async function globalSetup(globalConfig: Config.GlobalConfig): Promise<void> {
  if (!runIncludesSharedDistSuite(globalConfig)) {
    return;
  }
  console.time('export-shared-dist');
  await exportSharedDistAsync();
  console.timeEnd('export-shared-dist');
}

/** A filtered run (for example `pnpm test:e2e install-while-running`) skips the export when no selected suite serves the shared dist. */
function runIncludesSharedDistSuite(globalConfig: Config.GlobalConfig): boolean {
  if (!globalConfig.testPathPatterns.isSet()) {
    return true;
  }
  const patterns = globalConfig.testPathPatterns.toExecutor({ rootDir: globalConfig.rootDir });
  return findTestFiles(path.join(__dirname, '__tests__')).some(
    (file) =>
      patterns.isMatch(file) && fs.readFileSync(file, 'utf8').includes(SHARED_DIST_SUITE_MARKER)
  );
}

function findTestFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return findTestFiles(entryPath);
    }
    return /\.test\.[jt]sx?$/.test(entry.name) ? [entryPath] : [];
  });
}

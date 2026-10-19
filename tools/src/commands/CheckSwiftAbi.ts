import { Command } from '@expo/commander';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';
import {
  AbiModule,
  CORE_MODULE,
  JSI_MODULE,
  readBaseVersionAsync,
  resolveBaselineAbiAsync,
  xcframeworkAbiPath,
} from '../swift-abi/Baseline';
import { findMissingBumps, getRequiredPackagesAsync } from '../swift-abi/ChangesetCoverage';
import {
  DigesterFinding,
  isBreakingFinding,
  parseDigesterReport,
  runDigesterAsync,
} from '../swift-abi/Digester';
import { formatAbiFailure, formatAbiFindings } from '../swift-abi/Report';

type ActionOptions = {
  baseRef: string;
};

function currentAbiPath(module: AbiModule): string {
  return xcframeworkAbiPath(
    path.join(
      EXPO_DIR,
      'packages',
      module.packageName,
      '.expo-prebuild/output/release/xcframeworks',
      `${module.productName}.xcframework`
    ),
    module.productName
  );
}

type ModuleResult = { findings: DigesterFinding[]; skipped?: string };

async function checkModuleAsync(
  module: AbiModule,
  baseRef: string,
  workDir: string
): Promise<ModuleResult> {
  const current = currentAbiPath(module);
  if (!fs.existsSync(current)) {
    throw new Error(
      `The Swift ABI check could not find the ${module.productName} ABI file from this branch: ${current}\n` +
        `Run \`bin/expo-turbo run precompile-ios --filter=${module.packageName}\` first.`
    );
  }
  const version = await readBaseVersionAsync(baseRef, module.packageName);
  const baseline = await resolveBaselineAbiAsync(module, version, workDir);
  if (baseline.status === 'unpublished') {
    return {
      findings: [],
      skipped: `${module.packageName}@${version} is not published yet. Re-run the check after the publish.`,
    };
  }
  if (baseline.status === 'missing') {
    if (module === CORE_MODULE) {
      throw new Error(
        `The Swift ABI check could not find the ${module.productName} ABI file in ${module.packageName}@${version} on npm. ` +
          'The published package layout probably changed. Update `resolveBaselineAbiAsync` to read the new layout.'
      );
    }
    return {
      findings: [],
      skipped: `${module.packageName}@${version} on npm has no ABI file. The first release with \`publishAbiDescriptor\` adds it.`,
    };
  }
  const findings = parseDigesterReport(await runDigesterAsync(baseline.path, current));
  logger.info(
    `${module.productName}: compared with ${module.packageName}@${version}, ${findings.length} finding(s).`
  );
  return { findings: findings.filter(isBreakingFinding) };
}

async function checkAsync(options: ActionOptions, workDir: string) {
  const findings = new Map<string, DigesterFinding[]>();
  const skipped: string[] = [];
  for (const module of [CORE_MODULE, JSI_MODULE]) {
    const result = await checkModuleAsync(module, options.baseRef, workDir);
    if (result.skipped) {
      skipped.push(`${module.productName} was not compared: ${result.skipped}`);
    }
    if (result.findings.length > 0) {
      findings.set(module.productName, result.findings);
    }
  }
  for (const message of skipped) {
    logger.warn(message);
  }
  if (findings.size === 0) {
    if (skipped.length === 0) {
      logger.success('No Swift ABI breaks found.');
    } else {
      logger.warn('No Swift ABI breaks found in the modules that were compared.');
    }
    return;
  }

  const missing = await findMissingBumps(
    path.join(EXPO_DIR, '.changeset'),
    await getRequiredPackagesAsync()
  );
  if (missing.length === 0) {
    logger.info(formatAbiFindings(findings));
    logger.success('A changeset republishes every precompiled package, so the check passes.');
    return;
  }
  logger.error(formatAbiFailure(findings, missing));
  process.exitCode = 1;
}

async function action(options: ActionOptions) {
  const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'swift-abi-check-'));
  try {
    await checkAsync(options, workDir);
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true });
  }
}

export default (program: Command) => {
  program
    .command('check-swift-abi')
    .description(
      'Compares the Swift ABI of ExpoModulesCore and ExpoModulesJSI built from this branch with the published versions.'
    )
    .option('--base-ref <ref>', 'Git ref whose package versions are the baseline.', 'origin/main')
    .asyncAction(action);
};

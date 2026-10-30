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
import {
  findMissingBumps,
  getRequiredPackagesAsync,
  packagesToBump,
} from '../swift-abi/ChangesetCoverage';
import {
  DigesterFinding,
  isBreakingFinding,
  parseDigesterReport,
  runDigesterAsync,
} from '../swift-abi/Digester';
import { formatAbiFailure, formatAbiFindings } from '../swift-abi/Report';
import {
  demangleAsync,
  findMissingSymbols,
  Flavor,
  librariesToCheck,
  parseImports,
  readExportsAsync,
  readImportsAsync,
  resolveModuleBinariesAsync,
  simulatorBinaryPath,
} from '../swift-abi/Symbols';

type ActionOptions = {
  baseRef: string;
};

function currentXcframework(module: AbiModule, flavor: Flavor): string {
  return path.join(
    EXPO_DIR,
    'packages',
    module.packageName,
    '.expo-prebuild/output',
    flavor,
    'xcframeworks',
    `${module.productName}.xcframework`
  );
}

type ModuleResult = { findings: DigesterFinding[]; skipped?: string };

function requireBuildOutput(file: string, module: AbiModule, description: string) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `The Swift ABI check could not find the ${module.productName} ${description} from this branch: ${file}\n` +
        `Run \`bin/expo-turbo run precompile-ios --filter=${module.packageName}\` first.`
    );
  }
}

const FLAVORS: Flavor[] = ['debug', 'release'];

type ExportsByModule = Map<AbiModule, Set<string>>;
type SymbolFinding = { packageName: string; label: string; findings: DigesterFinding[] };
type SymbolResult = { findings: SymbolFinding[]; checked: number; skipped?: string };

async function readCurrentExportsAsync(flavor: Flavor): Promise<ExportsByModule> {
  const exports: ExportsByModule = new Map();
  for (const module of [CORE_MODULE, JSI_MODULE]) {
    const binary = simulatorBinaryPath(currentXcframework(module, flavor), module.productName);
    requireBuildOutput(binary, module, `${flavor} binary`);
    exports.set(module, await readExportsAsync(binary));
  }
  return exports;
}

async function checkBinaryAsync(
  packageName: string,
  label: string,
  binary: string,
  exports: ExportsByModule,
  libraries: string[]
): Promise<SymbolFinding[]> {
  const imports = await readImportsAsync(binary);
  const findings: SymbolFinding[] = [];
  for (const [module, moduleExports] of exports) {
    if (!libraries.includes(module.productName)) {
      continue;
    }
    const missing = findMissingSymbols(parseImports(imports, module.productName), moduleExports);
    if (missing.length > 0) {
      findings.push({
        packageName,
        label: `${label} imports ${module.productName} symbols that this branch no longer exports`,
        findings: (await demangleAsync(missing)).map((message) => ({
          section: 'Symbols',
          message,
        })),
      });
    }
  }
  return findings;
}

async function checkPackageAsync(
  packageName: string,
  baseRef: string,
  workDir: string,
  exportsByFlavor: Map<Flavor, ExportsByModule>
): Promise<SymbolResult> {
  const version = await readBaseVersionAsync(baseRef, packageName);
  const findings: SymbolFinding[] = [];
  let checked = 0;
  for (const flavor of FLAVORS) {
    const result = await resolveModuleBinariesAsync(packageName, version, flavor, workDir);
    if (result.status === 'unpublished') {
      return {
        findings: [],
        checked: 0,
        skipped: `${packageName}@${version} is not published yet. Re-run the check after the publish.`,
      };
    }
    if (result.status === 'none') {
      logger.info(`${packageName}@${version} has no ${flavor} prebuilds to check.`);
      continue;
    }
    for (const { product, binary } of result.binaries) {
      const libraries = librariesToCheck(packageName, product);
      if (libraries.length === 0) {
        continue;
      }
      const label = `${product}@${version} (${flavor})`;
      findings.push(
        ...(await checkBinaryAsync(
          packageName,
          label,
          binary,
          exportsByFlavor.get(flavor)!,
          libraries
        ))
      );
      checked++;
    }
  }
  return { findings, checked };
}

async function checkSymbolsAsync(baseRef: string, workDir: string): Promise<SymbolResult[]> {
  const exportsByFlavor = new Map<Flavor, ExportsByModule>();
  for (const flavor of FLAVORS) {
    exportsByFlavor.set(flavor, await readCurrentExportsAsync(flavor));
  }
  const packages = [...(await getRequiredPackagesAsync()), CORE_MODULE.packageName];
  const results = await Promise.all(
    packages.map((packageName) => checkPackageAsync(packageName, baseRef, workDir, exportsByFlavor))
  );
  const checked = results.reduce((total, result) => total + result.checked, 0);
  logger.info(`Symbols: checked ${checked} published module binaries.`);
  return results;
}

async function checkModuleAsync(
  module: AbiModule,
  baseRef: string,
  workDir: string
): Promise<ModuleResult> {
  const current = xcframeworkAbiPath(currentXcframework(module, 'release'), module.productName);
  requireBuildOutput(current, module, 'ABI file');
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
  const findings = parseDigesterReport(await runDigesterAsync(baseline.path, current)).filter(
    isBreakingFinding
  );
  logger.info(
    `${module.productName}: compared with ${module.packageName}@${version}, ${findings.length} finding(s).`
  );
  return { findings };
}

async function checkAsync(options: ActionOptions, workDir: string) {
  const findings = new Map<string, DigesterFinding[]>();
  const skipped: string[] = [];
  const abiFindings: DigesterFinding[] = [];
  for (const module of [CORE_MODULE, JSI_MODULE]) {
    const result = await checkModuleAsync(module, options.baseRef, workDir);
    if (result.skipped) {
      skipped.push(`${module.productName} was not compared: ${result.skipped}`);
    }
    if (result.findings.length > 0) {
      findings.set(`${module.productName} ABI changes`, result.findings);
      abiFindings.push(...result.findings);
    }
  }
  const affected: string[] = [];
  let symbolsComplete = true;
  for (const result of await checkSymbolsAsync(options.baseRef, workDir)) {
    if (result.skipped) {
      skipped.push(`Symbols were not compared: ${result.skipped}`);
      symbolsComplete = false;
    }
    for (const finding of result.findings) {
      findings.set(finding.label, finding.findings);
      affected.push(finding.packageName);
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

  const required = packagesToBump({
    abiFindings,
    affected,
    symbolsComplete,
    all: await getRequiredPackagesAsync(),
  });
  if (required.length === 0) {
    logger.warn(formatAbiFindings(findings));
    logger.warn(
      'These ABI changes only remove symbols that no published precompiled module imports, so no republish is needed.'
    );
    return;
  }
  const missing = await findMissingBumps(path.join(EXPO_DIR, '.changeset'), required);
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
      'Compares the Swift ABI of ExpoModulesCore and ExpoModulesJSI built from this branch with the published versions, and checks that published precompiled modules still find every symbol they import from them.'
    )
    .option('--base-ref <ref>', 'Git ref whose package versions are the baseline.', 'origin/main')
    .asyncAction(action);
};

#!/usr/bin/env node
/**
 * Replace XCFramework for Debug/Release Configuration
 *
 * Per-pod product swap: extracts <xcframeworksDir>/artifacts/<module>-<config>.tar.xz
 * over <Product>.xcframework, gated on <xcframeworksDir>/artifacts/.last_build_configuration.
 * Sibling shared-dep symlinks under <xcframeworksDir>/ are preserved (only the product
 * xcframework is wiped before re-extracting).
 *
 * Shared-dep repoint (each --shared entry): atomically replaces
 * <xcframeworksDir>/<Name>.xcframework with a symlink to <source_base>/<config>/<Name>.xcframework
 * and writes <xcframeworksDir>/artifacts/<Name>.last_config. The owner pod (decided at pod
 * install time by ensure_shared_spm_deps) receives --shared args for each dep it owns.
 *
 * Usage:
 *   node replace-xcframework.js -c <CONFIG> -m <MODULE> -x <XCFRAMEWORKS_DIR>
 *                               [--shared <Name>:<source_base>]...
 *
 * Based on React Native's replace-rncore-version.js pattern.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_PREFIX = '[Expo XCFramework]';

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { config: null, module: null, xcframeworksDir: null, sharedDeps: [] };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-c':
      case '--config':
        result.config = args[++i];
        break;
      case '-m':
      case '--module':
        result.module = args[++i];
        break;
      case '-x':
      case '--xcframeworks':
        result.xcframeworksDir = args[++i];
        break;
      case '-s':
      case '--shared': {
        const spec = args[++i] || '';
        const colon = spec.indexOf(':');
        if (colon === -1) {
          console.error(`${LOG_PREFIX} Invalid --shared (expected "<Name>:<source_base>"): ${spec}`);
          process.exit(1);
        }
        result.sharedDeps.push({ name: spec.slice(0, colon), sourceBase: spec.slice(colon + 1) });
        break;
      }
    }
  }
  return result;
}

function readState(file) {
  try {
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : null;
  } catch {
    return null;
  }
}

function processPerPodSwap(args, configLower) {
  const { xcframeworksDir, module: moduleName } = args;
  if (!fs.existsSync(xcframeworksDir) || !fs.statSync(xcframeworksDir).isDirectory()) {
    console.error(`${LOG_PREFIX} ${moduleName}: Directory not found: ${xcframeworksDir}`);
    process.exit(1);
  }

  const artifactsDir = path.join(xcframeworksDir, 'artifacts');
  fs.mkdirSync(artifactsDir, { recursive: true });
  const tarballPath = path.join(artifactsDir, `${moduleName}-${configLower}.tar.xz`);
  const lastConfigFile = path.join(artifactsDir, '.last_build_configuration');

  if (!fs.existsSync(tarballPath)) {
    console.error(`${LOG_PREFIX} ${moduleName}: Tarball not found at ${tarballPath}, skipping.`);
    return;
  }

  const lastConfig = readState(lastConfigFile);
  if (lastConfig === configLower) {
    console.log(`${LOG_PREFIX} ${moduleName}: Already extracted ${configLower}, skipping.`);
    return;
  }

  // Only remove the product xcframework — shared-dep symlinks staged by
  // ensure_shared_spm_deps are repointed separately below via --shared.
  const productXcfw = path.join(xcframeworksDir, `${moduleName}.xcframework`);
  try {
    fs.rmSync(productXcfw, { recursive: true, force: true });
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error(`${LOG_PREFIX} ${moduleName}: failed to remove product xcframework: ${e.message}`);
    }
  }

  const result = spawnSync('tar', ['-xf', tarballPath, '-C', xcframeworksDir], { stdio: 'pipe' });
  if (result.status !== 0) {
    console.error(`${LOG_PREFIX} ${moduleName}: tar failed: ${result.stderr?.toString().trim()}`);
    process.exit(1);
  }

  fs.writeFileSync(lastConfigFile, configLower);
  console.log(
    lastConfig
      ? `${LOG_PREFIX} ${moduleName}: Switched from ${lastConfig} to ${configLower}.`
      : `${LOG_PREFIX} ${moduleName}: Extracted ${configLower} tarball.`
  );
}

function repointSharedDep(xcframeworksDir, name, sourceBase, configLower) {
  const artifactsDir = path.join(xcframeworksDir, 'artifacts');
  fs.mkdirSync(artifactsDir, { recursive: true });
  const stateFile = path.join(artifactsDir, `${name}.last_config`);
  const linkPath = path.join(xcframeworksDir, `${name}.xcframework`);

  // Trust the state file only when the symlink is still present — an externally
  // deleted symlink (e.g. clear_cocoapods_cache wiping the pod dir) must trigger
  // a re-link even if the state file claims the right config.
  if (readState(stateFile) === configLower && fs.existsSync(linkPath)) return;

  const target = path.join(sourceBase, configLower, `${name}.xcframework`);
  if (!fs.existsSync(target)) {
    console.error(
      `${LOG_PREFIX} Shared dep ${name}: target not found at ${target}. Run the precompile prebuild pipeline for the ${configLower} flavor, or ensure prebuilds/spm-deps/${name}/${configLower}/${name}.xcframework ships with the consuming package.`
    );
    process.exit(1);
  }

  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.symlinkSync(target, linkPath);
  fs.writeFileSync(stateFile, configLower);
  console.log(`${LOG_PREFIX} Shared dep ${name}: repointed to ${configLower} (${target}).`);
}

function main() {
  const args = parseArgs();
  if (!args.config || !args.module || !args.xcframeworksDir) {
    console.error(
      'Usage: replace-xcframework.js -c <CONFIG> -m <MODULE> -x <XCFRAMEWORKS_DIR> [--shared <Name>:<source_base>]...'
    );
    process.exit(1);
  }
  const configLower = args.config.toLowerCase();
  if (configLower !== 'debug' && configLower !== 'release') {
    console.error(`${LOG_PREFIX} Invalid configuration: ${args.config}. Must be "debug" or "release".`);
    process.exit(1);
  }

  processPerPodSwap(args, configLower);
  for (const dep of args.sharedDeps) {
    repointSharedDep(args.xcframeworksDir, dep.name, dep.sourceBase, configLower);
  }
}

main();

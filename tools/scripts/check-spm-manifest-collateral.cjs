#!/usr/bin/env node

// Run from any directory: node tools/scripts/check-spm-manifest-collateral.cjs
// Later migrations: --base <ref> --exclude <npm-package>/<product> (repeatable).
// Artifacts contain metadata only; this gate compares manifests, not compiled binaries.
const { globSync } = require('glob');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseArgs } = require('node:util');
const ts = require('typescript');

const repo = path.resolve(__dirname, '../..');
const { values } = parseArgs({
  options: {
    base: { type: 'string', default: '466da8e06a1' },
    exclude: { type: 'string', multiple: true, default: [] },
    include: { type: 'string', multiple: true, default: [] },
    'only-comparable': { type: 'boolean', default: false },
    worker: { type: 'string' },
    scratch: { type: 'string' },
  },
});

function write(file, content = '') {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function git(...args) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], {
    cwd: repo,
    maxBuffer: 256 * 1024 * 1024,
  });
}

function ensureBaselineReachable(base = values.base) {
  try {
    execFileSync('git', ['-c', 'core.fsmonitor=false', 'cat-file', '-e', `${base}^{commit}`], {
      cwd: repo,
      stdio: 'ignore',
    });
  } catch {
    const error = new Error(
      `Unable to read SwiftPM manifest collateral baseline ${base}.\n` +
        'Why: the baseline commit is unavailable; shallow clones do not contain enough history.\n' +
        'How to fix: fetch the baseline history (CI: set actions/checkout fetch-depth: 0; locally: run git fetch --unshallow).'
    );
    // This expected setup failure is actionable on its own; other errors retain their stacks.
    error.stack = error.message;
    throw error;
  }
}

function configPaths(root = repo) {
  return globSync('packages/**/spm.config.json', {
    cwd: root,
    ignore: ['**/node_modules/**', '**/.build/**', '**/build/**'],
  }).sort();
}

function inventory(configs, read) {
  return configs
    .flatMap((relative) => {
      const packageName = relative.includes('/external-configs/ios/')
        ? path.dirname(relative.split('/external-configs/ios/')[1])
        : JSON.parse(read(path.join(path.dirname(relative), 'package.json'))).name;
      return JSON.parse(read(relative)).products.map((product) => `${packageName}/${product.name}`);
    })
    .sort();
}

function classifyInventory(before, after, excluded = new Set()) {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const known = new Set([...before, ...after]);
  for (const id of excluded)
    assert.ok(known.has(id), `Exclusion does not name a real product: ${id}`);
  const removed = before.filter((id) => !excluded.has(id) && !afterSet.has(id));
  assert.equal(removed.length, 0, `Baseline SwiftPM products disappeared: ${removed.join(', ')}`);
  return {
    additions: after.filter((id) => !excluded.has(id) && !beforeSet.has(id)),
    comparable: before.filter((id) => !excluded.has(id) && afterSet.has(id)),
  };
}

function formatInventoryAdditions(additions) {
  if (additions.length === 0) return undefined;
  return `INFO: Current-only SwiftPM products (not compared): ${additions.join(', ')}`;
}

function checkInventory() {
  const baselinePaths = git('ls-tree', '-r', '--name-only', values.base, '--', 'packages')
    .toString()
    .trim()
    .split('\n')
    .filter((file) => file.endsWith('/spm.config.json'));
  const before = inventory(baselinePaths, (file) =>
    git('show', `${values.base}:${file}`).toString()
  );
  const after = inventory(configPaths(), (file) => fs.readFileSync(path.join(repo, file), 'utf8'));
  const excluded = new Set(values.exclude);
  const comparison = classifyInventory(before, after, excluded);
  const additionMessage = formatInventoryAdditions(comparison.additions);
  if (additionMessage) console.log(additionMessage);
  return comparison.comparable;
}

function compile(source, destination) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const input = path.join(source, entry.name);
    const output = path.join(destination, entry.name);
    if (entry.isDirectory()) compile(input, output);
    else if (
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.d.ts') &&
      !entry.name.endsWith('.test.ts')
    ) {
      write(
        output.replace(/\.ts$/, '.js'),
        ts.transpileModule(fs.readFileSync(input, 'utf8'), {
          compilerOptions: {
            target: ts.ScriptTarget.ES2023,
            module: ts.ModuleKind.CommonJS,
            esModuleInterop: true,
          },
          fileName: input,
        }).outputText
      );
    } else if (entry.name.endsWith('.json')) write(output, fs.readFileSync(input));
  }
}

async function generate() {
  const scratch = values.scratch;
  const fixtureRoot = path.join(scratch, values.worker, 'repo');
  process.env.EXPO_ROOT_DIR = fixtureRoot;
  const build = path.join(scratch, values.worker, 'build');
  const { SPMPackage } = require(path.join(build, 'prebuilds/SPMPackage.js'));
  const { Frameworks } = require(path.join(build, 'prebuilds/Frameworks.js'));
  const { resolvePackagePath } = require(path.join(build, 'prebuilds/resolvePackage.js'));
  const configs = configPaths(fixtureRoot);
  assert.ok(configs.length > 0, 'Must discover real configs');
  const packages = configs.map((relative) => {
    const config = JSON.parse(fs.readFileSync(path.join(fixtureRoot, relative), 'utf8'));
    const external = relative.includes('/external-configs/ios/');
    const packageName = external
      ? path.dirname(relative.split('/external-configs/ios/')[1])
      : JSON.parse(
          fs.readFileSync(path.join(fixtureRoot, path.dirname(relative), 'package.json'), 'utf8')
        ).name;
    const packagePath = external
      ? resolvePackagePath(packageName)
      : path.join(fixtureRoot, path.dirname(relative));
    return {
      path: packagePath,
      buildPath: path.join(fixtureRoot, 'packages/precompile/.build', packageName),
      packageName,
      packageVersion: JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'))
        .version,
      getSwiftPMConfiguration: () => structuredClone(config),
      relative,
      config,
      external,
    };
  });
  const excluded = new Set(values.exclude);
  const included = new Set(values.include);
  const selected = [];
  for (const pkg of packages) {
    for (const product of pkg.config.products) {
      const id = `${pkg.packageName}/${product.name}`;
      if (excluded.has(id)) {
        continue;
      }
      if (values['only-comparable'] && !included.has(id)) {
        continue;
      }
      if (!pkg.external) {
        assert.ok(
          !fs.existsSync(path.join(pkg.path, 'Package.swift')),
          `${id} has opted in; explicitly --exclude it after migration`
        );
      }
      const baselineConfig = JSON.parse(git('show', `${values.base}:${pkg.relative}`).toString());
      assert.deepEqual(
        product,
        baselineConfig.products.find((candidate) => candidate.name === product.name),
        `${id} config changed; exclude migrated products explicitly`
      );
      selected.push({ pkg, product, id });
    }
  }
  assert.ok(selected.length > 0, 'Must compare at least one product');

  for (const pkg of packages) {
    for (const product of pkg.config.products) {
      for (const flavor of ['Debug', 'Release']) {
        const framework = Frameworks.getFrameworkPath(pkg.buildPath, product.name, flavor);
        write(path.join(framework, 'ios-arm64', `${product.name}.framework/Headers/Fixture.h`));
      }
    }
  }
  const cachePath = path.join(scratch, 'artifact-cache');
  for (const flavor of ['debug', 'release']) {
    write(
      path.join(
        cachePath,
        'react/0.88.0',
        flavor,
        'ReactNativeHeaders.xcframework/ios-arm64/Headers/module.modulemap'
      ),
      'module ReactFixture {}'
    );
  }
  const snapshots = {};
  for (const { pkg, product, id } of selected) {
    for (const flavor of ['Debug', 'Release']) {
      const artifactPaths = {
        cachePath,
        reactNativeVersion: '0.88.0',
        hermesVersion: '1.0.0',
        react: path.join(cachePath, 'react/0.88.0', flavor.toLowerCase()),
        hermes: path.join(cachePath, 'hermes/1.0.0', flavor.toLowerCase()),
        reactNativeDependencies: path.join(
          cachePath,
          'react-native-dependencies/0.88.0',
          flavor.toLowerCase()
        ),
      };
      const output = path.join(pkg.buildPath, 'generated', product.name, 'Package.swift');
      assert.ok(!fs.existsSync(output), `${id}/${flavor} output must start absent`);
      await SPMPackage.writePackageSwiftAsync(
        pkg,
        structuredClone(product),
        flavor,
        output,
        path.dirname(output),
        artifactPaths
      );
      assert.ok(fs.existsSync(output), `${id}/${flavor} did not write Package.swift`);
      const content = fs.readFileSync(output, 'utf8');
      assert.ok(content.trim().length > 0, `${id}/${flavor} wrote an empty Package.swift`);
      assert.ok(
        !content.includes('<EXPO_ROOT_DIR>'),
        `${id}/${flavor} contains reserved normalization marker <EXPO_ROOT_DIR>`
      );
      snapshots[`${id}/${flavor}`] = content.split(fixtureRoot).join('<EXPO_ROOT_DIR>');
      fs.rmSync(output);
    }
  }
  write(path.join(scratch, `${values.worker}.json`), JSON.stringify(snapshots));
  console.log(
    `Generated ${Object.keys(snapshots).length} manifests for ${selected.length} products (${packages.length} configs; ${excluded.size} explicit exclusions).`
  );
}

function copyCurrentPackageInputs(destination) {
  const files = git(
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
    '--',
    'packages'
  )
    .toString()
    .split('\0')
    .filter(Boolean);
  for (const relative of files) {
    const source = path.join(repo, relative);
    let stat;
    try {
      stat = fs.lstatSync(source);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    const output = path.join(destination, relative);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    if (stat.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(source), output);
    else if (stat.isFile()) fs.copyFileSync(source, output);
  }
}

function prepareFixture(scratch, label) {
  const fixtureRoot = path.join(scratch, label, 'repo');
  fs.mkdirSync(path.join(fixtureRoot, 'packages/precompile'), { recursive: true });
  for (const entry of fs.readdirSync(repo)) {
    if (entry !== 'packages' && entry !== '.git')
      fs.symlinkSync(path.join(repo, entry), path.join(fixtureRoot, entry));
  }
  if (label === 'before') {
    execFileSync('tar', ['-xf', '-', '-C', fixtureRoot], {
      input: git('archive', values.base, 'packages'),
    });
  } else {
    copyCurrentPackageInputs(fixtureRoot);
  }
  fs.mkdirSync(path.join(fixtureRoot, 'packages/precompile'), { recursive: true });
}

async function main() {
  if (values.worker) return generate();
  ensureBaselineReachable();
  const comparable = checkInventory();
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-manifest-collateral-'));
  try {
    prepareFixture(scratch, 'before');
    prepareFixture(scratch, 'after');
    const baselineSource = path.join(scratch, 'base-source');
    fs.mkdirSync(baselineSource);
    execFileSync('tar', ['-xf', '-', '-C', baselineSource], {
      input: git('archive', values.base, 'tools/src'),
    });
    for (const [label, source] of [
      ['before', path.join(baselineSource, 'tools/src')],
      ['after', path.join(repo, 'tools/src')],
    ]) {
      const destination = path.join(scratch, label);
      compile(source, path.join(destination, 'build'));
      fs.symlinkSync(path.join(repo, 'tools/node_modules'), path.join(destination, 'node_modules'));
    }

    function runWorker(label) {
      const args = [__filename, '--worker', label, '--scratch', scratch, '--base', values.base];
      args.push('--only-comparable');
      for (const id of values.exclude) args.push('--exclude', id);
      for (const id of comparable) args.push('--include', id);
      try {
        const output = execFileSync(process.execPath, args, {
          cwd: repo,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          maxBuffer: 16 * 1024 * 1024,
        });
        return { status: 0, stdout: output, stderr: '' };
      } catch (error) {
        return { status: error.status, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
      }
    }

    function requireWorkerSuccess(label, result) {
      if (result.status !== 0) {
        process.stderr.write(result.stdout);
        process.stderr.write(result.stderr);
        throw new Error(`${label} generator failed (exit ${result.status})`);
      }
      console.log(`${label}: ${result.stdout.trim().split('\n').at(-1)}`);
    }

    function compareSnapshots() {
      const before = JSON.parse(fs.readFileSync(path.join(scratch, 'before.json'), 'utf8'));
      const after = JSON.parse(fs.readFileSync(path.join(scratch, 'after.json'), 'utf8'));
      assert.deepEqual(Object.keys(after), Object.keys(before), 'Product/flavor coverage changed');
      const changed = Object.keys(before).filter((id) => before[id] !== after[id]);
      for (const id of changed) console.error(`DIFF: ${id}`);
      assert.equal(changed.length, 0, 'Collateral manifest changes');
      console.log(
        `PASS: ${Object.keys(before).length} byte-identical manifests across ${Object.keys(before).length / 2} products (Debug + Release), baseline ${values.base}.`
      );
    }

    requireWorkerSuccess('before', runWorker('before'));
    requireWorkerSuccess('after', runWorker('after'));
    compareSnapshots();
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

module.exports = { classifyInventory, ensureBaselineReachable, formatInventoryAdditions };

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

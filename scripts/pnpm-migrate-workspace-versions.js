#!/usr/bin/env node

/**
 * Replaces version references to local monorepo packages with workspace: protocol
 * in all package.json files under packages/ and apps/.
 *
 * - dependencies / peerDependencies in packages/: `workspace:<existing range>` (preserves semver range)
 * - devDependencies / optionalDependencies: `workspace:*`
 * - All fields in apps/: `workspace:*`
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// Gather all local package names from workspace globs
function getLocalPackageNames() {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const globs = rootPkg.workspaces?.packages || rootPkg.workspaces || [];

  const names = new Set();
  for (const glob of globs) {
    const dir = path.join(ROOT, glob.replace('/*', ''));
    if (!fs.existsSync(dir)) continue;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pkgJsonPath = path.join(dir, entry.name, 'package.json');
      if (!fs.existsSync(pkgJsonPath)) continue;
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        if (pkg.name) names.add(pkg.name);
      } catch {}
    }
  }
  return names;
}

// Find all package.json files under packages/ and apps/
function findPackageJsons() {
  const results = [];
  const dirs = ['packages', 'apps'];

  function walk(dir, depth = 0) {
    if (depth > 3) return;
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === 'package.json') {
        results.push(full);
      } else if (entry.isDirectory()) {
        walk(full, depth + 1);
      }
    }
  }

  for (const d of dirs) {
    walk(path.join(ROOT, d));
  }
  return results;
}

const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

function main() {
  const localNames = getLocalPackageNames();
  console.log(`Found ${localNames.size} local packages`);

  const packageJsons = findPackageJsons();
  console.log(`Found ${packageJsons.length} package.json files to process\n`);

  let totalReplacements = 0;
  let filesModified = 0;

  for (const pkgPath of packageJsons) {
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    let modified = false;

    for (const field of DEP_FIELDS) {
      const deps = pkg[field];
      if (!deps) continue;

      const isApp = path.relative(ROOT, pkgPath).startsWith('apps/');
      const preserveRange =
        !isApp && (field === 'dependencies' || field === 'peerDependencies');
      for (const [name, version] of Object.entries(deps)) {
        if (!localNames.has(name) || version.startsWith('workspace:')) continue;
        deps[name] = preserveRange ? `workspace:${version}` : 'workspace:*';
        modified = true;
        totalReplacements++;
      }
    }

    if (modified) {
      // Preserve original trailing newline
      const hasTrailingNewline = raw.endsWith('\n');
      let output = JSON.stringify(pkg, null, 2);
      if (hasTrailingNewline) output += '\n';
      fs.writeFileSync(pkgPath, output);
      filesModified++;
      console.log(`  Updated: ${path.relative(ROOT, pkgPath)}`);
    }
  }

  console.log(`\nDone! Replaced ${totalReplacements} version references in ${filesModified} files.`);
}

main();

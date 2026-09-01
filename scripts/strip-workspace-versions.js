#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const exceptionsPath = path.join(repoRoot, 'workspace-dependency-exceptions.json');
const dependencyFields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

const workspacePackages = JSON.parse(
  execFileSync('pnpm', ['-r', '--depth=-1', 'ls', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
);
const workspacePackageNames = new Set(workspacePackages.map((pkg) => pkg.name));

const exceptions = [];
let changedFiles = 0;
let changedSpecifiers = 0;

for (const workspacePackage of workspacePackages) {
  const packageJsonPath = path.join(workspacePackage.path, 'package.json');
  const source = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(source);
  let updatedSource = source;
  const replacements = new Map();

  for (const field of dependencyFields) {
    for (const [dependencyName, specifier] of Object.entries(packageJson[field] ?? {})) {
      if (!workspacePackageNames.has(dependencyName) || typeof specifier !== 'string') {
        continue;
      }

      if (!specifier.startsWith('workspace:') && specifier !== '*') {
        exceptions.push({
          package: workspacePackage.name,
          packageJson: path.relative(repoRoot, packageJsonPath),
          dependencyField: field,
          dependency: dependencyName,
          specifier,
        });
        continue;
      }

      const match = specifier.match(/^workspace:([~^]?)(?:\d|v\d).*$/);
      if (!match) {
        continue;
      }

      const newSpecifier = `workspace:${match[1] || '*'}`;
      replacements.set(`${dependencyName}\0${specifier}`, {
        dependencyName,
        specifier,
        newSpecifier,
      });
      changedSpecifiers++;
    }
  }

  for (const { dependencyName, specifier, newSpecifier } of replacements.values()) {
    const propertyPattern = new RegExp(
      `(${escapeRegExp(JSON.stringify(dependencyName))}\\s*:\\s*)${escapeRegExp(JSON.stringify(specifier))}`,
      'g'
    );
    let replacementCount = 0;
    updatedSource = updatedSource.replace(propertyPattern, (_match, propertyPrefix) => {
      replacementCount++;
      return `${propertyPrefix}${JSON.stringify(newSpecifier)}`;
    });

    if (replacementCount === 0) {
      throw new Error(`Could not update ${dependencyName} in ${packageJsonPath}`);
    }
  }

  if (replacements.size > 0) {
    fs.writeFileSync(packageJsonPath, updatedSource);
    changedFiles++;
  }
}

exceptions.sort((a, b) =>
  [a.packageJson, a.dependencyField, a.dependency]
    .join(':')
    .localeCompare([b.packageJson, b.dependencyField, b.dependency].join(':'))
);
fs.writeFileSync(exceptionsPath, `${JSON.stringify(exceptions, null, 2)}\n`);

console.log(`Enumerated ${workspacePackages.length} workspace packages.`);
console.log(`Updated ${changedSpecifiers} workspace specifiers in ${changedFiles} files.`);
console.log(
  `Wrote ${exceptions.length} dependency exceptions to ${path.relative(repoRoot, exceptionsPath)}.`
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

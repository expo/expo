#!/usr/bin/env node
'use strict';

const path = require('path');
const findUp = require('find-up');
const findYarnWorkspaceRoot = require('find-yarn-workspace-root');

if (module === require.main) {
  (async () => {
    const moduleRootPkgJson = await findUp('package.json');
    const projectRoot = path.dirname(moduleRootPkgJson);
    const root = findYarnWorkspaceRoot(projectRoot);
    const rootNodeModules = path.join(root, 'node_modules');
    const modulePathRelative = path.relative(process.cwd(), rootNodeModules);

    console.log(modulePathRelative);
  })();
}

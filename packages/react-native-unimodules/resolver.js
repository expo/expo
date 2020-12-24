#!/usr/bin/env node
'use strict';

const path = require('path');
const findUp = require('find-up');
const resolveFrom = require('resolve-from');

if (module === require.main) {
    (async () => {
        const projectRoot = await findUp('package.json')
        const args = process.argv.slice(2);
        const moduleName = args[0];
        let modulePath = resolveFrom.silent(projectRoot, moduleName);
        if (modulePath) {
            const moduleRootPkgJson = await findUp('package.json', { cwd: modulePath})
            const moduleRoot = path.dirname(moduleRootPkgJson)
            modulePath = moduleRoot
            // modulePath = path.relative(projectRoot, moduleRoot)
        }
        console.log(modulePath);
    })()
}

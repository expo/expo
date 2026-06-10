#!/usr/bin/env node

import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { glob } from 'glob';

const packageRoot = path.resolve(import.meta.dirname, '..');
const srcRoot = path.join(packageRoot, 'src');
const buildRoot = path.join(packageRoot, 'build');

const files = await glob('**/*.module.css', {
  cwd: srcRoot,
  nodir: true,
});

await Promise.all(
  files.map(async (file) => {
    const source = path.join(srcRoot, file);
    const destination = path.join(buildRoot, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination);
  })
);

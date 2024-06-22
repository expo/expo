#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import { compile } from 'json-schema-to-typescript';
import path from 'path';
import semver from 'semver';

let version: string = '';

const packageJSON = require('../package.json');

const program = new Command(packageJSON.name)
  .version(packageJSON.version)
  .arguments('[version]')
  .usage(`${chalk.green('[version]')} [options]`)
  .description('Generate TypeScript types from the Expo config JSON schema.')
  .option('-p, --path <schema-path>', 'Path to a local JSON schema to use.')
  .action((inputVersion: string, options: any) => {
    version = inputVersion;
  })
  .allowUnknownOption()
  .parse(process.argv);

async function fetchSchemaAsync(version: string): Promise<Record<string, any>> {
  const url = `http://exp.host/--/api/v2/project/configuration/schema/${version}`;

  const response = await fetch(url);
  const data = await response.json();

  return data.data.schema;
}

(async () => {
  const programPath = program.getOptionValue('path');
  let schema = {};

  if (programPath && typeof programPath === 'string') {
    const filePath = path.resolve(programPath.trim());
    console.log(`Using local file: "${filePath}"`);
    try {
      schema = (await fs.readJSON(filePath)).schema;
    } catch (error) {
      console.warn('Failed to read the local JSON schema:');
      console.error(error);
      process.exit(1);
    }
    if (!schema) {
      console.error(
        `The local file "${filePath}" doesn't contain a valid JSON schema with a top-level \`schema\` object`
      );
      process.exit(1);
    }
  } else {
    if (typeof version === 'string') {
      version = version.trim();
    }

    if (!version) {
      // @ts-ignore
      version = semver.parse(packageJSON.version).major;
      console.log('Using package version: ' + version);
    }
    let parsedVersion = version;
    if (parsedVersion !== 'unversioned') {
      parsedVersion += '.0.0';
    } else {
      parsedVersion = parsedVersion.toUpperCase();
    }

    schema = await fetchSchemaAsync(parsedVersion);
  }

  const ts = await compile(schema as any, 'ExpoConfig', {
    bannerComment: `/* tslint:disable */\n/**\n* The standard Expo config object defined in \`app.config.js\` files.\n*/`,
    unknownAny: false,
  });
  const filepath = `src/ExpoConfig.ts`;
  fs.ensureDirSync(path.dirname(filepath));
  await fs.writeFile(filepath, ts, 'utf8');
})();

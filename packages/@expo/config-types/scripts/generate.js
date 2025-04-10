#!/usr/bin/env node

const chalk = require('chalk');
const { Command } = require('commander');
const { compile } = require('json-schema-to-typescript');
const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');

let version = '';

const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

const program = new Command(packageJSON.name)
  .version(packageJSON.version)
  .arguments('[version]')
  .usage(`${chalk.green('[version]')} [options]`)
  .description('Generate TypeScript types from the Expo config JSON schema.')
  .option('-p, --path <schema-path>', 'Path to a local JSON schema to use.')
  .action(/** @param {string} inputVersion */ (inputVersion, _options) => {
    version = inputVersion;
  })
  .allowUnknownOption()
  .parse(process.argv);

/**
  * @param {string} version
  * @returns {Promise<Record<string, any>>}
  */
async function fetchSchemaAsync(version) {
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
      const schemaContent = await fs.promises.readFile(filePath, 'utf8');
      schema = JSON.parse(schemaContent).schema;
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

  const ts = await compile(schema, 'ExpoConfig', {
    bannerComment: `/* tslint:disable */\n/**\n* The standard Expo config object defined in \`app.config.js\` files.\n*/`,
    unknownAny: false,
  });
  const filepath = `src/ExpoConfig.ts`;
  await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
  await fs.promises.writeFile(filepath, ts, 'utf8');
})();

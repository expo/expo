/**
 * This script updates the necessary schema for the passed-in version.
 *
 * pnpm schema-sync 38 -> updates the schema that versions/v38.0.0/sdk/app-config.md uses
 * pnpm schema-sync unversioned -> updates the schema that versions/unversioned/sdk/app-config.md uses
 */

import parser from '@apidevtools/json-schema-ref-parser';
import fs from 'fs-extra';
import path from 'node:path';

const version = process.argv[2];

async function run() {
  if (!version) {
    console.log('Please enter a version number\n');
    console.log('E.g., "pnpm schema-sync 38" \nor, "pnpm schema-sync unversioned"');
    return;
  }

  if (version === 'unversioned') {
    console.log('Fetching schema for unversioned from production...');
    const response = await fetch(
      `http://exp.host/--/api/v2/project/configuration/schema/UNVERSIONED`
    );
    const responseJson = await response.json();
    const schema = await preprocessSchema(responseJson.data.schema);

    await fs.writeFile(
      `public/static/schemas/unversioned/app-config-schema.json`,
      JSON.stringify(schema.properties),
      'utf8'
    );
  } else {
    try {
      console.log(`Fetching schema for ${version} from production...`);
      await fetchAndWriteSchema(version, false);
    } catch {
      console.log(`Unable to fetch schema for ${version} from production, trying staging...`);
      await fetchAndWriteSchema(version, true);
    }
  }
}

async function fetchAndWriteSchema(version, staging) {
  const schemaPath = `public/static/schemas/v${version}.0.0/app-config-schema.json`;
  fs.ensureDirSync(path.dirname(schemaPath));

  const hostname = staging ? 'staging.exp.host' : 'exp.host';

  const response = await fetch(
    `http://${hostname}/--/api/v2/project/configuration/schema/${version}.0.0`
  );
  const responseJson = await response.json();
  const schema = await preprocessSchema(responseJson.data.schema);

  await fs.writeFile(schemaPath, JSON.stringify(schema.properties), 'utf8');
}

async function preprocessSchema(schema) {
  // replace all $ref references with the actual definitions
  return parser.dereference(schema);
}

run();

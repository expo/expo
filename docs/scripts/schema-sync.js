/*
This script updates the necessary schema for the passed-in version.

yarn run schema-sync 38 -> updates the schema that versions/v38.0.0/sdk/app-config.md uses
yarn run schema-sync unversioned -> updates the schema that versions/unversioned/sdk/app-config.md uses
*/

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const version = process.argv[2];

async function run() {
  if (!version) {
    console.log('Please enter a version number\n');
    console.log('E.g., "yarn run schema-sync 38" \nor, "yarn run schema-sync unversioned"');
    return;
  }

  if (version === 'unversioned') {
    const { data } = await axios.get(
      `http://exp.host/--/api/v2/project/configuration/schema/UNVERSIONED`
    );

    await fs.writeFile(
      `scripts/schemas/unversioned/app-config-schema.js`,
      'export default ',
      'utf8'
    );
    await fs.appendFile(
      `scripts/schemas/unversioned/app-config-schema.js`,
      JSON.stringify(data.data.schema.properties),
      'utf8'
    );
  } else {
    try {
      console.log(`Fetching schema for ${version} from production...`);
      await fetchAndWriteSchema(version, false);
    } catch (e) {
      console.log(`Unable to fetch schema for ${version} from production, trying staging...`);
      await fetchAndWriteSchema(version, true);
    }
  }
}

async function fetchAndWriteSchema(version, staging) {
  const schemaPath = `scripts/schemas/v${version}.0.0/app-config-schema.js`;
  fs.ensureDirSync(path.dirname(schemaPath));

  const hostname = staging ? 'staging.exp.host' : 'exp.host';

  const { data } = await axios.get(
    `http://${hostname}/--/api/v2/project/configuration/schema/${version}.0.0`
  );
  await fs.writeFile(schemaPath, 'export default ', 'utf8');
  await fs.appendFile(schemaPath, JSON.stringify(data.data.schema.properties), 'utf8');
}

run();

/*
This script updates the necessary schema for the passed-in version.

yarn run schema-sync 38 -> updates the schema that versions/v38.0.0/sdk/app-config.md uses
yarn run schema-sync unversioned -> updates the schema that versions/unversioned/sdk/app-config.md uses
*/

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.log('Please enter a version number\n');
  console.log('E.g., "yarn run schema-sync 38" \nor, "yarn run schema-sync unversioned"');
  return;
}

if (version === 'unversioned') {
  axios
    .get(`http://exp.host/--/api/v2/project/configuration/schema/UNVERSIONED`)
    .then(async ({ data }) => {
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
    });
} else {
  const schemaPath = `scripts/schemas/v${version}.0.0/app-config-schema.js`;
  fs.ensureDirSync(path.dirname(schemaPath));

  axios
    .get(`http://exp.host/--/api/v2/project/configuration/schema/${version}.0.0`)
    .then(async ({ data }) => {
      await fs.writeFile(schemaPath, 'export default ', 'utf8');
      await fs.appendFile(schemaPath, JSON.stringify(data.data.schema.properties), 'utf8');
    });
}

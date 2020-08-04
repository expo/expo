/*
This script updates the necessary xdl schemas.

At build time (or when running a dev server), next.config.js will 
automatically runs this script for every SDK version
*/

const axios = require('axios');
const fsExtra = require('fs-extra');

const schema_sync = function(version) {
  if (!version) {
    console.log('Please enter a version number\n');
    console.log('E.g., "yarn run schema-sync 38" \nor, "yarn run schema-sync unversioned"');
    return;
  }

  if (version === 'unversioned') {
    axios
      .get(`http://exp.host/--/api/v2/project/configuration/schema/UNVERSIONED`)
      .then(async ({ data }) => {
        await fsExtra.writeFile(
          `scripts/schemas/unversioned/app-config-schema.js`,
          'export default ',
          'utf8'
        );
        await fsExtra.appendFile(
          `scripts/schemas/unversioned/app-config-schema.js`,
          JSON.stringify(data.data.schema.properties),
          'utf8'
        );
      });
  } else {
    axios
      .get(`http://exp.host/--/api/v2/project/configuration/schema/${version}.0.0`)
      .then(async ({ data }) => {
        await fsExtra.writeFile(
          `scripts/schemas/v${version}.0.0/app-config-schema.js`,
          'export default ',
          'utf8'
        );
        await fsExtra.appendFile(
          `scripts/schemas/v${version}.0.0/app-config-schema.js`,
          JSON.stringify(data.data.schema.properties),
          'utf8'
        );
      });
  }
};

module.exports = { schema_sync };

// if running script manually, include version parameter
// e.g., node ./scripts/schema-sync.js 38
if (require.main === module) {
  schema_sync(process.argv[2]);
}

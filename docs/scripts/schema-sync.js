const axios = require('axios');
let fsExtra = require('fs-extra');

let version = process.argv[2];

if (version === 'unversioned') {
  axios
    .get(`http://exp.host/--/api/v2/project/configuration/schema/UNVERSIONED`)
    .then(async ({ data }) => {
      await fsExtra.writeFile(
        `./pages/versions/unversioned/app-config-schema.js`,
        'export default ',
        'utf8'
      );
      await fsExtra.appendFile(
        `./pages/versions/unversioned/app-config-schema.js`,
        JSON.stringify(data.data.schema.properties),
        'utf8'
      );
    });
} else {
  axios
    .get(`http://exp.host/--/api/v2/project/configuration/schema/${version}.0.0`)
    .then(async ({ data }) => {
      await fsExtra.writeFile(
        `./pages/versions/v${version}.0.0/app-config-schema.js`,
        'export default ',
        'utf8'
      );
      await fsExtra.appendFile(
        `./pages/versions/v${version}.0.0/app-config-schema.js`,
        JSON.stringify(data.data.schema.properties),
        'utf8'
      );
    });
}

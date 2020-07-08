const axios = require('axios');
let fsExtra = require('fs-extra');

axios
  .get('http://exp.host/--/api/v2/project/configuration/schema/38.0.0')
  .then(async ({ data }) => {
    await fsExtra.writeFile('scripts/app-json-schema.js', 'export default ', 'utf8');
    await fsExtra.appendFile(
      'scripts/app-json-schema.js',
      JSON.stringify(data.data.schema.properties),
      'utf8'
    );
  });

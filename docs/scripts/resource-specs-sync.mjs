import fs from 'fs';
import fetch from 'node-fetch';

async function run() {
  const resourceSpecsSource =
    'https://raw.githubusercontent.com/expo/eas-build/main/public/resource-specs/current.json';

  console.log(`Fetching resource specs from ${resourceSpecsSource}`);

  const response = await fetch(resourceSpecsSource);
  if (!response.ok) {
    console.error(`Failed to fetch resource specs from ${resourceSpecsSource}`);
    console.error(`Response status: ${response.status}`);
    console.error(`Response body: ${await response.text()}`);
    return;
  }

  const data = await response.text();

  // TODO: is public the correct place for this?
  const resourcePath = 'public/static/resource-specs.json';

  console.log(`Writing resource specs to ${resourcePath}`);
  await fs.writeFile(resourcePath, data, { encoding: 'utf8' }, () => {});
}

run();

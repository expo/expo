const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');

const VERSIONS_DIR = path.join(__dirname, '..', 'versions');
const args = process.argv.slice(2);
const DOCS_URL = `https://${args[0]}/versions`;
const ALGOLIA_APP_ID = 'S6DBW4862L';
const ALGOLIA_API_KEY = '06b11271d5c32d6670c9bcbb73e95e85';

console.log(`Indexing docs at URL: ${DOCS_URL}`);

function buildAlgoliaConfig() {
  const baseAlgoliaConfig = {
    index_name: 'exponent-docs-v3',
    start_urls: [],
    stop_urls: [],
    selectors_exclude: ['a.anchor'],
    selectors: {
      lvl0: {
        selector: '.sidebar a.selected',
        default_value: 'Documentation',
        global: true,
      },
      lvl1: '.doc-layout h1',
      lvl2: '.doc-markdown h2',
      lvl3: '.doc-markdown h3',
      lvl4: '.doc-markdown h4',
      text: '.doc-markdown div, .doc-markdown li, .doc-markdown dl, .doc-markdown pre',
    },
    min_indexed_level: 1,
    scrap_start_urls: false,
    nb_hits: 63146,
  };

  const versionDirs = getDirectories(VERSIONS_DIR);
  const algoliaConfig = baseAlgoliaConfig;
  versionDirs.forEach(version => {
    const versionUrlBase = `${DOCS_URL}/${version}`;
    algoliaConfig.start_urls.push(
      ...[
        {
          url: `${versionUrlBase}/`,
          tags: [version],
        },
        {
          url: `${versionUrlBase}/index.html`,
          tags: [version],
        },
      ]
    );

    const sections = getDirectories(path.join(VERSIONS_DIR, version));
    algoliaConfig.stop_urls = [
      ...algoliaConfig.stop_urls,
      ...sections.map(s => `${versionUrlBase}/${s}/index.html$`),
    ];
  });

  return algoliaConfig;
}

function getDirectories(path) {
  return fs.readdirSync(path).filter(function(file) {
    return fs.statSync(path + '/' + file).isDirectory();
  });
}

function escape(str) {
  return str.replace(/\"/g, '\\"');
}

// Do work
const config = buildAlgoliaConfig();
console.log(config);

spawn(
  'docker',
  [
    'run',
    '--rm',
    '-e',
    `APPLICATION_ID=${ALGOLIA_APP_ID}`,
    '-e',
    `API_KEY=${ALGOLIA_API_KEY}`,
    '-e',
    `CONFIG='${JSON.stringify(config)}'`,
    '--name',
    'exponent-doc-builder',
    '-t',
    'gcr.io/exponentjs/algolia-documentation-scraper:latest',
    '/root/run',
  ],
  {
    stdio: 'inherit',
    shell: true,
  }
);

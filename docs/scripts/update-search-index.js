const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');

const VERSIONS_DIR = path.join(__dirname, '..', 'versions');
const DOCS_URL = 'https://docs.getexponent.com/versions';

function buildAlgoliaConfig() {
  const baseAlgoliaConfig = {
    "index_name": "exponent-docs",
    "start_urls": [],
    "stop_urls": [],
    "selectors_exclude": [
      ".headerlink"
    ],
    "selectors": {
      "lvl0": {
        "selector": "#left-column li.toctree-l1.current > a",
        "default_value": "Documentation"
      },
      "lvl1": "#right-column div.document h1",
      "lvl2": "#right-column div.document h2",
      "lvl3": "#right-column div.document h3",
      "lvl4": "#right-column div.document h4",
      "text": "#right-column p, #right-column li, #right-column dl, #right-column pre"
    },
    "min_indexed_level": 1,
    "scrap_start_urls": false,
    "nb_hits": 63146
  };

  const versionDirs = getDirectories(VERSIONS_DIR);
  const algoliaConfig = baseAlgoliaConfig;
  versionDirs.forEach(version => {
    const versionUrlBase = `${DOCS_URL}/${version}`;
    algoliaConfig.start_urls.push(...[
      {
        url: `${versionUrlBase}/`,
        tags: [
          version,
        ]
      },
      {
        url: `${versionUrlBase}/index.html`,
        tags: [
          version,
        ]
      },
    ]);

    const sections = getDirectories(path.join(VERSIONS_DIR, version));
    algoliaConfig.stop_urls = [
      ...algoliaConfig.stop_urls,
      ...sections.map(s => `${versionUrlBase}/${s}/index.html$`)
    ];
  });

  return algoliaConfig;
}

function getDirectories(path) {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path+'/'+file).isDirectory();
  });
}

function escape(str) {
  return str.replace(/\"/g, '\\"');
}

// Do work
const config = buildAlgoliaConfig();

const ALGOLIA_APP_ID = 'S6DBW4862L';
const ALGOLIA_API_KEY = '06b11271d5c32d6670c9bcbb73e95e85';

spawn('docker', [
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
], {
  stdio: 'inherit',
  shell: true,
});

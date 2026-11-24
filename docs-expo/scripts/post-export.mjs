// Completes the `expo export` output so that it has the same files as the Next.js `out`
// directory. `../docs/next.config.ts` does the sitemap steps in `exportPathMap`.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = path.resolve(import.meta.dirname, '..');
const docsRoot = path.resolve(projectRoot, '../docs');
const pagesRoot = path.join(docsRoot, 'pages');
const outputRoot = path.resolve(projectRoot, process.argv[2] ?? 'dist');

function importFromDocs(file) {
  return import(pathToFileURL(path.join(docsRoot, file)).href);
}

function readDocsJson(file) {
  return JSON.parse(fs.readFileSync(path.join(docsRoot, file), 'utf8'));
}

// `expo export` copies a symbolic link in `public` as a link. The output must hold the files.
function replaceLinksWithFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      const target = fs.realpathSync(entryPath);
      fs.rmSync(entryPath);
      fs.cpSync(target, entryPath, { recursive: true, dereference: true });
    }
  }
}

// Static hosts serve `404.html` for a missing page. Expo Router writes `+not-found.html`.
function writeNotFoundPages() {
  const notFoundPage = path.join(outputRoot, '+not-found.html');
  fs.copyFileSync(notFoundPage, path.join(outputRoot, '404.html'));
  fs.mkdirSync(path.join(outputRoot, '404'), { recursive: true });
  fs.renameSync(notFoundPage, path.join(outputRoot, '404/index.html'));
}

function readModificationDates(routes) {
  const dates = {};
  for (const route of routes) {
    const mdxPath = [
      path.join(pagesRoot, `${route}.mdx`),
      path.join(pagesRoot, route, 'index.mdx'),
    ].find(file => fs.existsSync(file));
    const date = mdxPath && fs.readFileSync(mdxPath, 'utf8').match(/^modificationDate:\s*(.+)$/m);
    if (!date) {
      continue;
    }
    const parsed = new Date(date[1].trim().replace(/(\d+)(st|nd|rd|th)/, '$1'));
    if (!isNaN(parsed.getTime())) {
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      dates[route] = `${parsed.getFullYear()}-${month}-${day}`;
    }
  }
  return dates;
}

async function writeSitemap() {
  const [{ default: createSitemap }, { default: createUrlRecoveryIndex }] = await Promise.all([
    importFromDocs('scripts/create-sitemap.js'),
    importFromDocs('scripts/create-url-recovery-index.js'),
  ]);
  const navigation = readDocsJson('public/static/constants/navigation.json');
  const { VERSIONS } = readDocsJson('public/static/constants/versions.json');
  const docsPackage = readDocsJson('package.json');
  const newestVersion = docsPackage.betaVersion ?? docsPackage.version;

  const routes = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'src/routes.generated.json'), 'utf8')
  )
    .map(route => (route === '/' ? route : route.slice(0, -1)))
    // The sitemap has no `unversioned` pages and no pages for an SDK that is not released.
    .filter(route => {
      const version = route.match(/\/v(\d+)\.\d+\.\d+\//)?.[1];
      return (
        !route.includes('unversioned') &&
        (!version || Number(version) <= Number(newestVersion.split('.')[0]))
      );
    });

  const sitemapEntries = createSitemap({
    pathMap: Object.fromEntries(routes.map(route => [route, { page: route }])),
    domain: 'https://docs.expo.dev',
    output: path.join(outputRoot, 'sitemap.xml'),
    pagesDirectory: pagesRoot,
    pathsPriority: [
      ...navigation.homeDirectories,
      ...navigation.easDirectories,
      ...navigation.learnDirectories,
      ...navigation.generalDirectories,
      ...navigation.referenceDirectories.filter(directory => directory === 'versions'),
      ...VERSIONS.map(version => `versions/${version}`),
    ],
    pathsHidden: [...navigation.previewDirectories, ...navigation.archiveDirectories, 'internal'],
    modificationDates: readModificationDates(routes),
  });
  console.log(`Generated sitemap with ${sitemapEntries.length} entries`);

  createUrlRecoveryIndex({
    urls: sitemapEntries,
    pagesDirectory: pagesRoot,
    output: path.join(outputRoot, '_url-recovery.json'),
  });
}

replaceLinksWithFiles(outputRoot);
writeNotFoundPages();
await writeSitemap();

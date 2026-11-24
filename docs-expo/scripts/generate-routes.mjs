// Writes one Expo Router route file for each page in `../docs/pages`.
//
// Expo Router finds routes with the pattern `.[tj]sx?`, so an MDX file cannot be a
// route. Each generated file is `<route>/index.tsx`, which exports `<route>/index.html`.
// That is the same output layout as Next.js with `trailingSlash: true`.
//
// The Next.js build also exports the `unversioned` pages. `exportPathMap` in
// `../docs/next.config.ts` does not remove them from the `out` directory.
//
// Usage: node scripts/generate-routes.mjs [--only <prefix>]...
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const docsRoot = path.resolve(projectRoot, '../docs');
const pagesRoot = path.join(docsRoot, 'pages');
const outputRoot = path.join(projectRoot, 'src/app');
const routeListPath = path.join(projectRoot, 'src/routes.generated.json');

// The files in `src/app` that this script does not write.
const SOURCE_FILES = new Set(['_layout.tsx', '+html.tsx', '+not-found.tsx']);

const args = process.argv.slice(2);
const onlyPrefixes = args.flatMap((arg, index) => (arg === '--only' ? [args[index + 1]] : []));

const { LATEST_VERSION } = JSON.parse(
  fs.readFileSync(path.join(docsRoot, 'public/static/constants/versions.json'), 'utf8')
);

// Finds the API data files that a page needs. The rules are the same as in
// `../docs/mdx-plugins/remark-api-section-data.js`. That plugin imports the files into the
// page module. Here the route `loader` reads them, so they stay out of the JavaScript bundles.
function findApiDataKeys(relativePath, source) {
  const keys = new Set();
  const pathVersion = relativePath.match(/^versions[/\\]([^/\\]+)[/\\]/)?.[1];

  for (const [element] of source.matchAll(/<APISection\b[^>]*>/g)) {
    const packageName = element.match(/\bpackageName=(?:"([^"]+)"|\{\s*\[([^\]]*)\]\s*\})/);
    if (!packageName) {
      if (/\bpackageName=/.test(element)) {
        throw new Error(
          `<APISection> in ${relativePath} uses a packageName that is not a literal.`
        );
      }
      continue;
    }
    if (/\bforceVersion=\{/.test(element)) {
      throw new Error(`<APISection> in ${relativePath} uses a forceVersion that is not a literal.`);
    }
    const forceVersion = element.match(/\bforceVersion="([^"]+)"/)?.[1];
    const version = forceVersion ?? pathVersion ?? 'latest';
    const names =
      packageName[1] !== undefined
        ? [packageName[1]]
        : [...packageName[2].matchAll(/['"]([^'"]+)['"]/g)].map(match => match[1]);

    for (const name of names) {
      const key = `${version === 'latest' ? LATEST_VERSION : version}/${name}`;
      if (fs.existsSync(path.join(docsRoot, 'public/static/data', `${key}.json`))) {
        keys.add(key);
      }
    }
  }
  return [...keys];
}

function getHelperImport(routeFile) {
  return path
    .relative(path.dirname(routeFile), path.join(projectRoot, 'src/routes'))
    .split(path.sep)
    .join('/');
}

function createMdxRouteSource(routeFile, relativePath, pageImport) {
  const helperImport = getHelperImport(routeFile);
  const apiDataKeys = findApiDataKeys(
    relativePath,
    fs.readFileSync(path.join(pagesRoot, relativePath), 'utf8')
  );

  if (apiDataKeys.length === 0) {
    return [
      `import * as page from '${pageImport}';`,
      `import { createMdxRoute } from '${helperImport}';`,
      '',
      'export default createMdxRoute(page);',
      '',
    ].join('\n');
  }

  return [
    `import * as page from '${pageImport}';`,
    `import { createMdxRouteWithApiData } from '${helperImport}';`,
    '',
    'export async function loader() {',
    '  return {',
    ...apiDataKeys.map(
      key => `    '${key}': require('~/public/static/data/${key}.json').children,`
    ),
    '  };',
    '}',
    '',
    'export default createMdxRouteWithApiData(page);',
    '',
  ].join('\n');
}

// A page that only redirects renders one `<meta http-equiv="refresh">` tag. Next.js adds the
// default `charset` and `viewport` tags to such a page.
function createPageRouteSource(routeFile, pagePath, pageImport) {
  const isRedirect = fs.readFileSync(pagePath, 'utf8').includes('~/common/redirect');
  const helper = isRedirect ? 'createPageRouteWithDefaultHead' : 'createPageRoute';
  return [
    `import Page from '${pageImport}';`,
    `import { ${helper} } from '${getHelperImport(routeFile)}';`,
    '',
    `export default ${helper}(Page);`,
    '',
  ].join('\n');
}

function listPages(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listPages(entryPath);
    }
    return /\.(mdx?|[jt]sx?)$/.test(entry.name) ? [entryPath] : [];
  });
}

for (const entry of fs.readdirSync(outputRoot)) {
  if (!SOURCE_FILES.has(entry)) {
    fs.rmSync(path.join(outputRoot, entry), { recursive: true, force: true });
  }
}

const routes = [];
for (const pagePath of listPages(pagesRoot)) {
  const relativePath = path.relative(pagesRoot, pagePath);
  if (path.basename(relativePath).startsWith('_')) {
    continue;
  }

  const extension = path.extname(relativePath);
  const withoutExtension = relativePath.slice(0, -extension.length);
  const routePath =
    path.basename(withoutExtension) === 'index' ? path.dirname(withoutExtension) : withoutExtension;
  const route = routePath === '.' ? '/' : `/${routePath.split(path.sep).join('/')}/`;

  if (/[+()[\]]/.test(route)) {
    throw new Error(`The page "${relativePath}" has a character that Expo Router reserves.`);
  }
  if (
    onlyPrefixes.length > 0 &&
    !onlyPrefixes.some(prefix => (prefix === '/' ? route === '/' : route.startsWith(prefix)))
  ) {
    continue;
  }

  const routeFile = path.join(outputRoot, route, 'index.tsx');
  const pageImport = `~/pages/${relativePath.split(path.sep).join('/')}`;
  const source = /\.mdx?$/.test(extension)
    ? createMdxRouteSource(routeFile, relativePath, pageImport)
    : createPageRouteSource(routeFile, pagePath, pageImport);

  fs.mkdirSync(path.dirname(routeFile), { recursive: true });
  fs.writeFileSync(routeFile, source);
  routes.push(route);
}

fs.writeFileSync(routeListPath, JSON.stringify(routes.sort()));
console.log(`Generated ${routes.length} route files in ${path.relative(projectRoot, outputRoot)}`);

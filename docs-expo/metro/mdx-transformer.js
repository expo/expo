const upstreamTransformer = require('@expo/metro-config/babel-transformer');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const { applySourcePatch } = require('./source-patches');

const docsRoot = path.resolve(__dirname, '../../docs');

// `../docs/next.config.ts` adds this webpack loader for the icon package. It makes the SVG
// path data shorter, which makes each HTML file smaller.
const ICON_MODULE_PATTERN = /[/\\]@expo[/\\]styleguide-icons[/\\].+\.m?js$/;
const optimizeIconPaths = require(path.join(docsRoot, 'scripts/optimize-icon-paths-loader.cjs'));

let processorOptionsPromise;

// The remark plugins in `../docs/mdx-plugins` are ES modules.
function importDocsPlugin(name) {
  return import(pathToFileURL(path.join(docsRoot, 'mdx-plugins', name)).href).then(
    mod => mod.default
  );
}

async function loadProcessorOptions() {
  const [
    { default: rehypeSlug },
    { default: remarkFrontmatter },
    { default: remarkGFM },
    { default: remarkMDX },
    { default: remarkMdxDisableExplicitJsx },
    { default: remarkMDXFrontmatter },
    remarkCodeTitle,
    remarkDiffBlockRaw,
    remarkExportHeadings,
    remarkImageSize,
    remarkLinkRewrite,
    remarkSDKCompatibility,
  ] = await Promise.all([
    import('rehype-slug'),
    import('remark-frontmatter'),
    import('remark-gfm'),
    import('remark-mdx'),
    import('remark-mdx-disable-explicit-jsx'),
    import('remark-mdx-frontmatter'),
    importDocsPlugin('remark-code-title.js'),
    importDocsPlugin('remark-diff-block-raw.js'),
    importDocsPlugin('remark-export-headings.js'),
    importDocsPlugin('remark-image-size.js'),
    importDocsPlugin('remark-link-rewrite.js'),
    importDocsPlugin('remark-sdk-compatibility.js'),
  ]);

  // Keep this list in the same order as `../docs/next.config.ts`. Two plugins of that list
  // are not here: `remark-api-section-data` and `remark-create-static-props`. They make the
  // Next.js `getStaticProps` export. `scripts/generate-routes.mjs` writes a route `loader`
  // for the same data.
  return {
    providerImportSource: '@mdx-js/react',
    remarkPlugins: [
      remarkMDX,
      remarkGFM,
      [remarkMdxDisableExplicitJsx, { whiteList: ['kbd'] }],
      remarkFrontmatter,
      [remarkMDXFrontmatter, { name: 'meta' }],
      remarkCodeTitle,
      remarkExportHeadings,
      remarkLinkRewrite,
      remarkImageSize,
      remarkDiffBlockRaw,
      remarkSDKCompatibility,
    ],
    rehypePlugins: [rehypeSlug],
  };
}

async function transform(props) {
  const projectRoot = props.options.projectRoot ?? path.resolve(__dirname, '..');
  const absolutePath = path.resolve(projectRoot, props.filename);

  if (ICON_MODULE_PATTERN.test(absolutePath)) {
    return upstreamTransformer.transform({ ...props, src: optimizeIconPaths(props.src) });
  }

  if (!/\.mdx?$/.test(props.filename)) {
    return upstreamTransformer.transform({
      ...props,
      src: applySourcePatch(absolutePath, props.src),
    });
  }

  processorOptionsPromise ??= loadProcessorOptions();
  const [{ compile }, processorOptions] = await Promise.all([
    import('@mdx-js/mdx'),
    processorOptionsPromise,
  ]);

  // The plugins resolve links and files from `cwd`. It must be the website directory.
  const compiled = await compile(
    { value: props.src, path: absolutePath, cwd: docsRoot },
    { ...processorOptions, development: !!props.options.dev }
  );

  return upstreamTransformer.transform({ ...props, src: String(compiled) });
}

// Metro reads this key to know when its transform cache is out of date. The output of this
// transformer also changes with the files that it loads from other locations.
function getCacheKey() {
  const hash = crypto.createHash('sha1');
  hash.update(upstreamTransformer.getCacheKey?.() ?? '');

  const pluginsRoot = path.join(docsRoot, 'mdx-plugins');
  const files = [
    __filename,
    require.resolve('./source-patches'),
    path.join(docsRoot, 'scripts/optimize-icon-paths-loader.cjs'),
    ...fs
      .readdirSync(pluginsRoot)
      .filter(name => name.endsWith('.js') && !name.endsWith('.test.js'))
      .map(name => path.join(pluginsRoot, name)),
  ];
  for (const file of files) {
    hash.update(fs.readFileSync(file));
  }
  return hash.digest('hex');
}

module.exports = { ...upstreamTransformer, transform, getCacheKey };

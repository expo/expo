const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const docsRoot = path.resolve(projectRoot, '../docs');
const compatRoot = path.join(projectRoot, 'src/next-compat');

// The website source stays in `../docs`. These modules replace the Next.js modules
// that the source (and `@expo/styleguide`) imports.
const NEXT_COMPAT_MODULES = {
  'next/router': path.join(compatRoot, 'router.tsx'),
  'next/compat/router': path.join(compatRoot, 'router.tsx'),
  'next/head': path.join(compatRoot, 'head.tsx'),
  'next/link': path.join(compatRoot, 'link.tsx'),
  'next/dynamic': path.join(compatRoot, 'dynamic.tsx'),
};

const config = getDefaultConfig(projectRoot);

config.watchFolders = [docsRoot];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mdx'];
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules')];
config.resolver.blockList = [
  ...[config.resolver.blockList ?? []].flat(),
  new RegExp(`^${escapeRegExp(docsRoot)}/(node_modules|\\.next|out|\\.vale|\\.wrangler)/.*`),
];
config.transformer.babelTransformerPath = require.resolve('./metro/mdx-transformer.js');

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = originalResolveRequest ?? context.resolveRequest;

  const compatModule = NEXT_COMPAT_MODULES[moduleName];
  if (compatModule) {
    return { type: 'sourceFile', filePath: compatModule };
  }

  if (moduleName.startsWith('~/')) {
    return resolve(context, path.join(docsRoot, moduleName.slice(2)), platform);
  }

  // A file in `../docs` must get its packages from `docs-expo/node_modules`.
  const isPackageImport = !moduleName.startsWith('.') && !path.isAbsolute(moduleName);
  if (isPackageImport && context.originModulePath.startsWith(docsRoot + path.sep)) {
    return resolve(
      { ...context, originModulePath: path.join(projectRoot, 'package.json') },
      moduleName,
      platform
    );
  }

  return resolve(context, moduleName, platform);
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = config;

/** Import `webpack` from the project. */
export function importWebpackFromProject(projectRoot: string): typeof import('webpack') {
  return require('webpack').default;
}

/** Import `@expo/webpack-config` from the project. */
export function importExpoWebpackConfigFromProject(
  projectRoot: string
): typeof import('@expo/webpack-config') {
  return require('@expo/webpack-config');
}

/** Import `webpack-dev-server` from the project. */
export function importWebpackDevServerFromProject(
  projectRoot: string
): typeof import('webpack-dev-server') {
  return require('webpack-dev-server').default;
}

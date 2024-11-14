/** Import `webpack` from the project. */
export function importWebpackFromProject(projectRoot: string) {
  return require('webpack').default;
}

/** Import `@expo/webpack-config` from the project. */
export function importExpoWebpackConfigFromProject(projectRoot: string) {
  return require('@expo/webpack-config');
}

/** Import `webpack-dev-server` from the project. */
export function importWebpackDevServerFromProject(projectRoot: string) {
  return require('webpack-dev-server').default;
}

import resolveFrom from 'resolve-from';

export function importDevMiddlewareFromProject(
  projectRoot: string
): typeof import('@react-native/dev-middleware') {
  const devMiddleware = resolveFrom.silent(projectRoot, '@react-native/dev-middleware');
  if (!devMiddleware) {
    throw new Error(`Missing package "@react-native/dev-middleware" in the project.`);
  }
  return require(devMiddleware);
}

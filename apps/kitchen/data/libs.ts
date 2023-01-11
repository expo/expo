const libs = require.context('../../../packages', true, /.*\.demo\.[jt]sx?/);

export function getPackages() {
  return libs.keys().map((path) => {
    const [pkg] = path.replace(/^\.\//, '').split('/');

    return pkg;
  });
}

export function getComponent(library: string) {
  const key = libs.keys().find((path) => {
    const [pkg] = path.replace(/^\.\//, '').split('/');

    return pkg === library;
  });

  return libs(key)?.default;
}

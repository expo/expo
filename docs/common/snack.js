export const SNACK_URL = 'https://snack.expo.io';
// export const SNACK_URL = 'http://snack.expo.test';

export function getSnackFiles(code, assets) {
  const files = {
    'App.js': {
      type: 'CODE',
      contents: code,
    },
  };

  if (assets) {
    Object.keys(assets).forEach(path => {
      files[path] = {
        type: 'ASSET',
        contents: assets[path],
      };
    });
  }

  return files;
}

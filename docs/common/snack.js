export const SNACK_URL = 'https://snack.expo.io';
// export const SNACK_URL = 'http://snack.expo.test';

export function getSnackFiles(config) {
  const { templateId, code, files, baseURL } = config;

  const result = {};
  if (files) {
    Object.keys(files).forEach(path => {
      const url = files[path];
      const isCode = /\.(jsx?|tsx?|json|md)$/i.test(path);
      if (isCode) {
        result[path] = {
          type: 'CODE',
          url: url.match(/^https?:\/\//) ? url : `${baseURL}/${url}`,
        };
      } else {
        result[path] = {
          type: 'ASSET',
          contents: url, // Should be a snack-code-uploads S3 url
        };
      }
    });
  }

  if (templateId) {
    result['App.js'] = { type: 'CODE', url: `${baseURL}/${templateId}.js` };
  } else if (code) {
    result['App.js'] = { type: 'CODE', contents: code };
  }

  return result;
}

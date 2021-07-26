export const SNACK_URL = 'https://snack.expo.dev';
// export const SNACK_URL = 'http://snack.expo.test';

type Config = {
  baseURL: string;
  templateId?: string;
  code?: string | null;
  files?: Record<string, string>;
};

type File = {
  type: 'CODE' | 'ASSET';
  contents?: string;
  url?: string;
};

export function getSnackFiles(config: Config) {
  const { templateId, code, files, baseURL } = config;

  const result: Record<string, File> = {};
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

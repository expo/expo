export const SNACK_URL = 'https://snack.expo.dev';
// export const SNACK_URL = 'http://snack.expo.test';

type Config = {
  baseURL: string;
  templateId?: string;
  code?: string | null;
  files?: Record<string, string>;
  codeLanguage?: string;
};

type File = {
  type: 'CODE' | 'ASSET';
  contents?: string;
  url?: string;
};

export function getSnackFiles(config: Config) {
  const { templateId, code, files, baseURL, codeLanguage } = config;

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
    if (codeLanguage === 'jsx') {
      result['App.js'] = { type: 'CODE', url: `${baseURL}/${templateId}.js` };
    } else {
      result['App.tsx'] = { type: 'CODE', url: `${baseURL}/${templateId}.tsx` };
    }
  } else if (code) {
    if (codeLanguage === 'jsx') {
      result['App.js'] = { type: 'CODE', contents: code };
    } else {
      result['App.tsx'] = { type: 'CODE', contents: code };
    }
  }

  return result;
}

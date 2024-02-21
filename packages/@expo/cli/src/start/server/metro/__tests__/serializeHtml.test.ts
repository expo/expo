import { serializeHtmlWithAssets } from '../serializeHtml';

it('serializes development static html', () => {
  const res = serializeHtmlWithAssets({
    resources: [
      {
        filename: '/Users/path/to/expo/packages/expo-router/entry.js',
        originFilename: '../../packages/expo-router/entry.js',
        type: 'js',
        metadata: { isAsync: false, requires: [], modulePaths: [] },
        source: '',
      },
    ],
    baseUrl: '',
    isExporting: false,
    template: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
    devBundleUrl: '/packages/expo-router/entry.bundle?platform=web',
  });
  expect(res).toMatchSnapshot();
  expect(res).toMatch(/<script src="\/packages\/expo-router\/entry\.bundle\?platform=web" defer>/);
});

it('serializes production static html for export', () => {
  const res = serializeHtmlWithAssets({
    resources: [
      {
        filename: 'dist/entry.js',
        originFilename: '../../packages/expo-router/entry.js',
        type: 'js',
        metadata: { isAsync: false, requires: [], modulePaths: [] },
        source: '',
      },
    ],
    baseUrl: '',
    isExporting: true,
    template: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
    devBundleUrl: '/packages/expo-router/entry.bundle?platform=web',
  });
  expect(res).toMatchSnapshot();
  expect(res).toMatch(/<script src="\/dist\/entry\.js" defer>/);
});

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

it('injects hydration flag', () => {
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
    hydrate: true,
  });
  expect(res).toMatchSnapshot();
  expect(res).toMatch(/__EXPO_ROUTER_HYDRATE__/);
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

it('serializes development export static html with correct script src', () => {
  const res = serializeHtmlWithAssets({
    resources: [
      {
        filename: '/Users/path/to/expo/app/node_modules/expo/AppEntry.js',
        originFilename: 'node_modules/expo/AppEntry.js',
        type: 'js',
        metadata: { isAsync: false, requires: [], modulePaths: [] },
        source: '',
      },
    ],
    template: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
    // Note, when `isExporting` is true, we combine `baseUrl` with the filename
    // Wehn empty, this caused an additional `/` to be added at the beginning of the `<script src="" />` tag
    baseUrl: '',
    isExporting: true,
  });
  expect(res).toMatchSnapshot();
  expect(res).toMatch(
    // Note the explicit `/Users` part, not adding a double `//` by accident
    /<script src="\/Users\/path\/to\/expo\/app\/node_modules\/expo\/AppEntry.js" defer>/
  );
});

it('serializes development export static html with correct baseUrl and script src', () => {
  const res = serializeHtmlWithAssets({
    resources: [
      {
        filename: '/Users/path/to/expo/app/node_modules/expo/AppEntry.js',
        originFilename: 'node_modules/expo/AppEntry.js',
        type: 'js',
        metadata: { isAsync: false, requires: [], modulePaths: [] },
        source: '',
      },
    ],
    template: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
    // Note, when `isExporting` is true, we combine `baseUrl` with the filename
    // Wehn empty, this caused an additional `/` to be added at the beginning of the `<script src="" />` tag
    baseUrl: '/custom/base/url/',
    isExporting: true,
  });
  expect(res).toMatchSnapshot();
  expect(res).toMatch(
    // Note the explicit `/Users` part, not adding a double `//` by accident
    /<script src="\/custom\/base\/url\/Users\/path\/to\/expo\/app\/node_modules\/expo\/AppEntry.js" defer>/
  );
});

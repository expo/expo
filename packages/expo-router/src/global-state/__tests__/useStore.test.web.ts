import { getStateFromPath } from '../../fork/getStateFromPath';
import { getLinkingConfig } from '../../getLinkingConfig';
import { getRoutes } from '../../getRoutes';
import { inMemoryContext } from '../../testing-library/context-stubs';
import { getInitialLayoutNodes } from '../useStore';

const context = inMemoryContext({
  _layout: () => null,
  index: () => null,
  '(tabs)/_layout': () => null,
  '(tabs)/home': () => null,
  '(tabs)/anchored/_layout': () => null,
  '(tabs)/anchored/index': () => null,
  '(tabs)/anchored/details': () => null,
  'other/_layout': () => null,
  'other/index': () => null,
});

const routeNode = getRoutes(context, { skipGenerated: true, ignoreEntryPoints: true })!;
const linking = getLinkingConfig(routeNode, context, {
  metaOnly: true,
  redirects: [],
  skipGenerated: false,
  sitemap: false,
  notFound: false,
});

describe(getInitialLayoutNodes, () => {
  it('returns the root layout and the layouts on the focused path', () => {
    const state = getStateFromPath('/anchored/details', linking.config);
    expect(getInitialLayoutNodes(routeNode, state).map((node) => node.contextKey)).toEqual([
      './_layout.js',
      './(tabs)/_layout.js',
      './(tabs)/anchored/_layout.js',
    ]);
  });

  it('stops at a leaf route', () => {
    const state = getStateFromPath('/home', linking.config);
    expect(getInitialLayoutNodes(routeNode, state).map((node) => node.contextKey)).toEqual([
      './_layout.js',
      './(tabs)/_layout.js',
    ]);
  });

  it('returns every layout without a parsed state', () => {
    expect(getInitialLayoutNodes(routeNode, undefined).map((node) => node.contextKey)).toEqual([
      './_layout.js',
      './(tabs)/_layout.js',
      './(tabs)/anchored/_layout.js',
      './other/_layout.js',
    ]);
  });
});

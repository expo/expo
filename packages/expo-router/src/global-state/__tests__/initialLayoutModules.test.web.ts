import { createLazyContext } from '../../__tests__/lazyContext';
import { getStateFromPath } from '../../fork/getStateFromPath';
import { getLinkingConfig } from '../../getLinkingConfig';
import { getRoutes } from '../../getRoutes';
import { inMemoryContext } from '../../testing-library/context-stubs';
import {
  getAllLayoutNodes,
  getLayoutNodesForState,
  getPendingLayoutModules,
} from '../initialLayoutModules';

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

describe(getLayoutNodesForState, () => {
  it('returns the root layout and the layouts on the focused path', () => {
    const state = getStateFromPath('/anchored/details', linking.config);
    expect(getLayoutNodesForState(routeNode, state).map((node) => node.contextKey)).toEqual([
      './_layout.js',
      './(tabs)/_layout.js',
      './(tabs)/anchored/_layout.js',
    ]);
  });

  it('stops at a leaf route', () => {
    const state = getStateFromPath('/home', linking.config);
    expect(getLayoutNodesForState(routeNode, state).map((node) => node.contextKey)).toEqual([
      './_layout.js',
      './(tabs)/_layout.js',
    ]);
  });

  it('returns every layout without a parsed state', () => {
    expect(getLayoutNodesForState(routeNode, undefined)).toEqual(getAllLayoutNodes(routeNode));
  });
});

describe(getAllLayoutNodes, () => {
  it('returns every layout in the tree', () => {
    expect(getAllLayoutNodes(routeNode).map((node) => node.contextKey)).toEqual([
      './_layout.js',
      './(tabs)/_layout.js',
      './(tabs)/anchored/_layout.js',
      './other/_layout.js',
    ]);
  });
});

describe(getPendingLayoutModules, () => {
  it('returns the modules that have not loaded yet', async () => {
    const lazy = createLazyContext({
      './_layout.tsx': { default: () => null },
      './index.tsx': { default: () => null },
    });
    const lazyRouteNode = getRoutes(lazy.context, {
      skipGenerated: true,
      ignoreEntryPoints: true,
      importMode: 'lazy',
    })!;

    const pending = getPendingLayoutModules([lazyRouteNode]);
    expect(pending).toHaveLength(1);

    await lazy.load();

    expect(getPendingLayoutModules([lazyRouteNode])).toEqual([]);
  });

  it('returns nothing for loaded modules', () => {
    expect(getPendingLayoutModules(getAllLayoutNodes(routeNode))).toEqual([]);
  });
});

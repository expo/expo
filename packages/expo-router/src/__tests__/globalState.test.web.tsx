import { createNavigationContainerRef } from '@react-navigation/native';

import { RouterStore, store } from '../global-state/router-store';
import { inMemoryContext } from '../testing-library/context-stubs';

describe(RouterStore, () => {
  it(`creates mock context with empty routes`, () => {
    store.initialize(inMemoryContext({}), createNavigationContainerRef());

    expect(store).toMatchObject({
      routeNode: null,
      rootState: undefined,
      initialState: undefined,
      linking: undefined,
      routeInfo: {
        unstable_globalHref: '',
        pathname: '',
        params: {},
        segments: [],
      },
    });
  });
  it(`creates qualified context with routes`, () => {
    store.initialize(
      inMemoryContext({
        index: () => null,
      }),
      createNavigationContainerRef()
    );

    expect(store).toMatchObject({
      routeNode: expect.objectContaining({
        children: [
          expect.objectContaining({
            children: [],
            contextKey: './index.js',
            dynamic: null,
            route: 'index',
          }),
          expect.objectContaining({
            children: [],
            contextKey: './_sitemap.tsx',
            dynamic: null,
            generated: true,
            internal: true,
            route: '_sitemap',
          }),
          expect.objectContaining({
            children: [],
            contextKey: './+not-found.tsx',
            dynamic: [
              {
                deep: true,
                name: '+not-found',
                notFound: true,
              },
            ],
            generated: true,
            internal: true,
            route: '+not-found',
          }),
        ],
        contextKey: './_layout.tsx',
        dynamic: null,
        generated: true,
        route: '',
      }),
      linking: expect.objectContaining({
        config: {
          initialRouteName: undefined,
          screens: {
            '+not-found': '*not-found',
            _sitemap: '_sitemap',
            index: '',
          },
        },
      }),
      rootState: undefined,
      initialState: undefined,
      routeInfo: {
        unstable_globalHref: '',
        pathname: '',
        params: {},
        segments: [],
      },
    });
  });

  it(`creates qualified context with routes and initial state`, () => {
    store.initialize(
      inMemoryContext({
        index: () => null,
      }),
      createNavigationContainerRef(),
      new URL('/', 'http://acme.com')
    );

    // Should be the same as`creates qualified context with routes`, but with these
    // additional properties
    expect(store).toMatchObject({
      rootState: {
        routes: [
          {
            name: 'index',
            path: '/',
          },
        ],
      },
      initialState: {
        routes: [
          {
            name: 'index',
            path: '/',
          },
        ],
      },
      routeInfo: {
        unstable_globalHref: '/',
        pathname: '/',
        params: {},
        segments: [],
      },
    });
  });
});

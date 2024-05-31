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
            contextKey: 'expo-router/build/views/Sitemap.js',
            dynamic: null,
            generated: true,
            internal: true,
            route: '_sitemap',
          }),
          expect.objectContaining({
            children: [],
            contextKey: 'expo-router/build/views/Unmatched.js',
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
        contextKey: 'expo-router/build/views/Navigator.js',
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
        page: () => null,
      }),
      createNavigationContainerRef(),
      {
        serverUrl: '/page',
      }
    );

    // Should be the same as`creates qualified context with routes`, but with these
    // additional properties
    expect(store).toMatchObject({
      rootState: {
        routes: [
          {
            name: 'page',
            path: '/page',
          },
        ],
      },
      initialState: {
        routes: [
          {
            name: 'page',
            path: '/page',
          },
        ],
      },
      routeInfo: {
        unstable_globalHref: '/page',
        pathname: '/page',
        params: {},
        segments: ['page'],
      },
    });
  });
});

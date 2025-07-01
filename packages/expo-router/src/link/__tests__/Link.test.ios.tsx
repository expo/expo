import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Button, Platform, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from '../../hooks';
import { router } from '../../imperative-api';
import Stack from '../../layouts/Stack';
import { renderRouter, screen } from '../../testing-library';
import { useNavigation } from '../../useNavigation';
import { Slot } from '../../views/Navigator';
import { Pressable } from '../../views/Pressable';
import { Link } from '../Link';
import { LinkPreviewContextProvider } from '../preview/LinkPreviewContext';
import type {
  NativeLinkPreviewActionProps,
  NativeLinkPreviewContentProps,
  NativeLinkPreviewTriggerProps,
  NativeLinkPreviewProps,
} from '../preview/native';

// Render and observe the props of the Link component.

jest.mock('../preview/native', () => {
  const { View } = require('react-native');
  const handlerMap: Record<string, Function | undefined> = {};
  return {
    NativeLinkPreview: jest.fn(
      ({
        children,
        onWillPreviewOpen,
        onPreviewTapped,
        onDidPreviewOpen,
        onActionSelected,
      }: NativeLinkPreviewProps) => {
        handlerMap['link-onWillPreviewOpen'] = () => onWillPreviewOpen();
        handlerMap['link-onPreviewTapped'] = onPreviewTapped;
        handlerMap['link-onDidPreviewOpen'] = onDidPreviewOpen;
        handlerMap['link-onActionSelected'] = onActionSelected;
        return <View testID="link-preview-native-view">{children}</View>;
      }
    ),
    NativeLinkPreviewContent: jest.fn(({ children }: NativeLinkPreviewContentProps) => (
      <View testID="link-preview-native-preview-view" children={children} />
    )),
    NativeLinkPreviewTrigger: jest.fn(({ children }: NativeLinkPreviewTriggerProps) => (
      <View testID="link-preview-native-trigger-view" children={children} />
    )),
    NativeLinkPreviewAction: jest.fn(({ children }: NativeLinkPreviewActionProps) => (
      <View testID="link-preview-native-action-view">{children}</View>
    )),
    __EVENTS__: handlerMap,
  };
});

it('renders a Link', () => {
  const { getByText } = render(<Link href="/foo">Foo</Link>);
  const node = getByText('Foo');
  expect(node).toBeDefined();
  expect(node.props.href).toBe('/foo');
  expect(node.props).toEqual({
    children: 'Foo',
    href: '/foo',
    onPress: expect.any(Function),
    role: 'link',
  });
});

it('renders a Link with React Native array style prop when using asChild', () => {
  const { getByTestId } = render(
    <Link asChild testID="link" href="/foo" style={[{ color: 'red' }, { backgroundColor: 'blue' }]}>
      <Pressable>
        <Text>Foo</Text>
      </Pressable>
    </Link>
  );
  const node = getByTestId('link');
  expect(node).toBeDefined();
  expect(node.props.style).toStrictEqual({
    color: 'red',
    backgroundColor: 'blue',
  });
});

xit('renders a Link with a slot', () => {
  const { getByText, getByTestId } = render(
    <Link asChild href="/foo">
      <View testID="pressable">
        <Text testID="inner-text">Button</Text>
      </View>
    </Link>
  );
  const node = getByText('Button');
  expect(node.props).toEqual({
    children: 'Button',
    testID: 'inner-text',
  });

  const pressable = getByTestId('pressable');
  if (Platform.OS === 'web') {
    expect(pressable.props).toEqual(
      expect.objectContaining({
        children: expect.anything(),
        href: '/foo',
        role: 'link',
        testID: 'pressable',
        onClick: expect.any(Function),
      })
    );
  } else {
    expect(pressable.props).toEqual(
      expect.objectContaining({
        children: expect.anything(),
        href: '/foo',
        role: 'link',
        testID: 'pressable',
        onPress: expect.any(Function),
      })
    );
  }
});

it('ignores className on native', () => {
  const { getByTestId } = render(
    <Link href="/foo" testID="link" style={{ color: 'red' }} className="xxx">
      Hello
    </Link>
  );
  const node = getByTestId('link');
  expect(node.props).toEqual(
    expect.objectContaining({
      children: 'Hello',
      className: 'xxx',
      href: '/foo',
      role: 'link',
      style: { color: 'red' },
      testID: 'link',
      onPress: expect.any(Function),
    })
  );
});

it('ignores className with slot on native', () => {
  const { getByTestId } = render(
    <Link asChild href="/foo" testID="link" style={{ color: 'red' }} className="xxx">
      <View />
    </Link>
  );
  const node = getByTestId('link');
  expect(node.props).toEqual(
    expect.objectContaining({
      children: undefined,
      className: 'xxx',
      href: '/foo',
      role: 'link',
      style: { color: 'red' },
      testID: 'link',
      onPress: expect.any(Function),
    })
  );
});

it('throws an error when using asChild with multiple children', () => {
  expect(() =>
    render(
      <Link asChild href="/foo">
        <Text>Foo</Text>
        <Text>Bar</Text>
      </Link>
    )
  ).toThrow(
    'Link: When using `asChild`, you must pass a single child element that will emit the `onPress` event.'
  );
});

it('strips web-only href attributes', () => {
  const { getByTestId } = render(
    <Link
      href="/foo"
      testID="link"
      style={{ color: 'red' }}
      download="file.png"
      rel="noopener"
      target="_blank">
      Link
    </Link>
  );
  const node = getByTestId('link');
  expect(node.props).toEqual(
    expect.objectContaining({
      children: 'Link',
      href: '/foo',
      role: 'link',
      style: { color: 'red' },
      testID: 'link',
      onPress: expect.any(Function),
    })
  );
});

it('can preserve the initialRoute', () => {
  renderRouter({
    index: function MyIndexRoute() {
      return (
        <Link testID="link" withAnchor href="/fruit/banana">
          Press me
        </Link>
      );
    },
    '/fruit/_layout': {
      unstable_settings: {
        anchor: 'apple',
      },
      default: () => {
        return <Stack />;
      },
    },
    '/fruit/apple': () => <Text testID="apple">Apple</Text>,
    '/fruit/banana': () => <Text testID="banana">Banana</Text>,
  });

  act(() => fireEvent.press(screen.getByTestId('link')));
  expect(screen.getByTestId('banana')).toBeDefined();
  act(() => router.back());
  expect(screen.getByTestId('apple')).toBeDefined();
  act(() => router.back());
  expect(screen.getByTestId('link')).toBeDefined();
});

it('can preserve the initialRoute with shared groups', () => {
  renderRouter({
    index: function MyIndexRoute() {
      return (
        <Link testID="link" withAnchor href="/(foo)/fruit/banana">
          Press me
        </Link>
      );
    },
    '/(foo,bar)/fruit/_layout': {
      unstable_settings: {
        anchor: 'apple',
        foo: {
          anchor: 'orange',
        },
      },
      default: () => {
        return <Stack />;
      },
    },
    '/(foo,bar)/fruit/apple': () => <Text testID="apple">Apple</Text>,
    '/(foo,bar)/fruit/orange': () => <Text testID="orange">Orange</Text>,
    '/(foo,bar)/fruit/banana': () => <Text testID="banana">Banana</Text>,
  });

  act(() => fireEvent.press(screen.getByTestId('link')));
  expect(screen.getByTestId('banana')).toBeDefined();
  act(() => router.back());
  expect(screen.getByTestId('orange')).toBeDefined();
  act(() => router.back());
  expect(screen.getByTestId('link')).toBeDefined();
});

describe('singular', () => {
  test('can dynamically route using singular', () => {
    renderRouter(
      {
        '[slug]': () => (
          <Link testID="link" href="/apple" dangerouslySingular>
            Slug
          </Link>
        ),
      },
      {
        initialUrl: '/apple',
      }
    );

    act(() => router.push('/apple'));
    act(() => router.push('/apple'));
    act(() => router.push('/banana'));

    expect(screen).toHaveRouterState({
      index: 0,
      key: expect.any(String),
      preloadedRoutes: [],
      routeNames: ['__root'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: {
            slug: 'apple',
          },
          state: {
            index: 3,
            key: expect.any(String),
            preloadedRoutes: [],
            routeNames: ['_sitemap', '[slug]', '+not-found'],
            routes: [
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'apple',
                },
                path: '/apple',
              },
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'apple',
                },
                path: undefined,
              },
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'apple',
                },
                path: undefined,
              },
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'banana',
                },
                path: undefined,
              },
            ],
            stale: false,
            type: 'stack',
          },
        },
      ],
      stale: false,
      type: 'stack',
    });

    // Should push /apple and remove all previous instances of /apple
    act(() => fireEvent.press(screen.getByTestId('link')));

    expect(screen).toHaveRouterState({
      index: 0,
      key: expect.any(String),
      preloadedRoutes: [],
      routeNames: ['__root'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: {
            slug: 'apple',
          },
          state: {
            index: 1,
            key: expect.any(String),
            preloadedRoutes: [],
            routeNames: ['_sitemap', '[slug]', '+not-found'],
            routes: [
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'banana',
                },
                path: undefined,
              },
              {
                key: expect.any(String),
                name: '[slug]',
                params: {
                  slug: 'apple',
                },
                path: undefined,
              },
            ],
            stale: false,
            type: 'stack',
          },
        },
      ],
      stale: false,
      type: 'stack',
    });
  });
});

test('can dynamically route using singular function', () => {
  renderRouter(
    {
      '[slug]': () => (
        <Link
          testID="link"
          href="/apple?id=1"
          dangerouslySingular={(_, params) => params.id?.toString()}>
          Slug
        </Link>
      ),
    },
    {
      initialUrl: '/apple',
    }
  );

  act(() => router.push('/apple?id=1'));
  act(() => router.push('/apple?id=1'));
  act(() => router.push('/apple?id=2'));
  act(() => router.push('/banana'));

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: {
          slug: 'apple',
        },
        state: {
          index: 4,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['_sitemap', '[slug]', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: '[slug]',
              params: {
                slug: 'apple',
              },
              path: '/apple',
            },
            {
              key: expect.any(String),
              name: '[slug]',
              params: {
                id: '1',
                slug: 'apple',
              },
              path: undefined,
            },
            {
              key: expect.any(String),
              name: '[slug]',
              params: {
                id: '1',
                slug: 'apple',
              },
              path: undefined,
            },
            {
              key: expect.any(String),
              name: '[slug]',
              params: {
                id: '2',
                slug: 'apple',
              },
              path: undefined,
            },
            {
              key: expect.any(String),
              name: '[slug]',
              params: {
                slug: 'banana',
              },
              path: undefined,
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });

  // Should push /apple and remove all previous instances of /apple
  act(() => fireEvent.press(screen.getByTestId('link')));

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: {
          slug: 'apple',
        },
        state: {
          index: 3,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['_sitemap', '[slug]', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: '[slug]',
              params: {
                slug: 'apple',
              },
              path: '/apple',
            },
            {
              key: expect.any(String),
              name: '[slug]',
              params: {
                id: '2',
                slug: 'apple',
              },
              path: undefined,
            },
            {
              key: expect.any(String),
              name: '[slug]',
              params: {
                slug: 'banana',
              },
              path: undefined,
            },
            {
              key: expect.any(String),
              name: '[slug]',
              params: {
                id: '1',
                slug: 'apple',
              },
              path: undefined,
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});

describe('prefetch', () => {
  it('can preload the href', () => {
    renderRouter({
      index: () => {
        return <Link prefetch href="/test" />;
      },
      test: () => null,
    });

    expect(screen).toHaveRouterState({
      index: 0,
      key: expect.any(String),
      preloadedRoutes: [],
      routeNames: ['__root'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: undefined,
          state: {
            index: 0,
            key: expect.any(String),
            preloadedRoutes: [
              {
                key: expect.any(String),
                name: 'test',
                params: {},
              },
            ],
            routeNames: ['index', 'test', '_sitemap', '+not-found'],
            routes: [
              {
                key: expect.any(String),
                name: 'index',
                params: undefined,
                path: '/',
              },
            ],
            stale: false,
            type: 'stack',
          },
        },
      ],
      stale: false,
      type: 'stack',
    });
  });
});

describe('Preview', () => {
  it('when Link.Preview is not used, then does not render LinkNativeView, LinkNativePreview and LinkNativeTrigger', () => {
    renderRouter({
      index: () => {
        return <Link prefetch href="/test" />;
      },
      test: () => null,
    });
    expect(screen.queryByTestId('link-preview-native-view')).toBeNull();
    expect(screen.queryByTestId('link-preview-native-preview-view')).toBeNull();
    expect(screen.queryByTestId('link-preview-native-trigger-view')).toBeNull();
  });
  it('when Link.Preview is used, renders LinkNativeView, LinkNativePreview and LinkNativeTrigger', () => {
    renderRouter({
      index: () => {
        return (
          <Link prefetch href="/test">
            <Link.Preview />
            <Link.Trigger />
          </Link>
        );
      },
      test: () => null,
    });
    expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
    expect(screen.getByTestId('link-preview-native-preview-view')).toBeVisible();
    expect(screen.getByTestId('link-preview-native-trigger-view')).toBeVisible();
  });
  it('when Link.Preview is used without Link.Trigger then exception is thrown', () => {
    expect(() => {
      render(
        <LinkPreviewContextProvider>
          <Link href="/foo">
            <Link.Preview />
          </Link>
        </LinkPreviewContextProvider>
      );
    }).toThrow(
      'When you use Link.Preview, you must use Link.Trigger to specify the trigger element'
    );
  });
  describe('lazy loading', () => {
    it('when using default preview, it is not visible on initial load', () => {
      renderRouter({
        index: () => {
          return (
            <Link prefetch href="/test">
              <Link.Preview />
              <Link.Trigger />
            </Link>
          );
        },
        test: () => <View testID="test-view" />,
      });
      expect(screen.getByTestId('link-preview-native-preview-view')).toBeVisible();
      expect(screen.queryByTestId('test-view')).toBeNull();
    });
    it('when using custom preview, it is not visible on initial load', () => {
      renderRouter({
        index: () => {
          return (
            <Link prefetch href="/test">
              <Link.Trigger />
              <Link.Preview>
                <View testID="preview" />
              </Link.Preview>
            </Link>
          );
        },
        test: () => <View testID="test-view" />,
      });
      expect(screen.getByTestId('link-preview-native-preview-view')).toBeVisible();
      expect(screen.queryByTestId('preview')).toBeNull();
    });
    it('when LinkNativeView emits onWillPreviewOpen, it loads the preview', () => {
      const emitters = require('../preview/native').__EVENTS__;
      renderRouter({
        index: () => {
          return (
            <Link prefetch href="/test">
              <Link.Trigger />
              <Link.Preview>
                <View testID="preview" />
              </Link.Preview>
            </Link>
          );
        },
        test: () => <View testID="test-view" />,
      });
      expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
      act(() => emitters['link-onWillPreviewOpen']());
      expect(screen.getByTestId('preview')).toBeVisible();
    });
    it('when LinkNativeView emits onWillPreviewOpen, it loads the default preview', () => {
      const emitters = require('../preview/native').__EVENTS__;
      renderRouter({
        index: () => {
          return (
            <Link prefetch href="/test">
              <Link.Preview />
              <Link.Trigger />
            </Link>
          );
        },
        test: () => <View testID="test-view" />,
      });
      expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
      act(() => emitters['link-onWillPreviewOpen']());
      expect(screen.getByTestId('test-view')).toBeVisible();
    });
  });
  describe('Link.Menu', () => {
    it('when Link.Menu items are passed, correct actions are passed to native', () => {
      const NativeLinkPreviewAction = require('../preview/native').NativeLinkPreviewAction;
      renderRouter({
        index: () => {
          return (
            <Link prefetch href="/test">
              <Link.Preview />
              <Link.Trigger>Trigger</Link.Trigger>
              <Link.Menu>
                <Link.MenuAction title="Test Item" onPress={() => {}} />
                <Text>Text child</Text>
                <Link.MenuAction title="Second actions" onPress={() => {}} />
              </Link.Menu>
            </Link>
          );
        },
        test: () => <View testID="test-view" />,
      });
      expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
      expect(screen.getAllByTestId('link-preview-native-action-view')).toHaveLength(3);
      expect(NativeLinkPreviewAction.mock.calls[0][0]).toMatchObject({
        id: 'undefined-0',
        title: '',
        children: [expect.any(Object), expect.any(Object)],
      });
      expect(NativeLinkPreviewAction.mock.calls[1][0]).toMatchObject({
        id: 'undefined-0Test Item-0',
        title: 'Test Item',
        children: [],
      });
      expect(NativeLinkPreviewAction.mock.calls[2][0]).toMatchObject({
        id: 'undefined-0Second actions-1',
        title: 'Second actions',
        children: [],
      });
    });
    it('when onActionSelected is called, correct press handler is called', () => {
      const indexIos = require('../preview/native');
      const NativeLinkPreviewAction = indexIos.NativeLinkPreviewAction;
      const emitters = indexIos.__EVENTS__;
      const action1OnPress = jest.fn();
      const action2OnPress = jest.fn();
      const emitOnActionSelected = (id: string) =>
        (emitters['link-onActionSelected'] as NativeLinkPreviewProps['onActionSelected'])({
          nativeEvent: { id },
        });

      renderRouter({
        index: () => {
          return (
            <Link prefetch href="/test">
              <Link.Preview />
              <Link.Trigger>Trigger</Link.Trigger>
              <Link.Menu>
                <Link.MenuAction title="Action 1" onPress={action1OnPress} />
                <Text>Text child</Text>
                <Link.MenuAction title="Action 2" onPress={action2OnPress} />
              </Link.Menu>
            </Link>
          );
        },
        test: () => <View testID="test-view" />,
      });
      expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
      expect(screen.getAllByTestId('link-preview-native-action-view')).toHaveLength(3);
      expect(NativeLinkPreviewAction).toHaveBeenCalledTimes(3);
      expect(NativeLinkPreviewAction.mock.calls[0][0]).toEqual({
        id: 'undefined-0',
        title: '',
        children: [expect.any(Object), expect.any(Object)],
      });
      expect(NativeLinkPreviewAction.mock.calls[1][0]).toMatchObject({
        id: 'undefined-0Action 1-0',
        title: 'Action 1',
        children: [],
      });
      expect(NativeLinkPreviewAction.mock.calls[2][0]).toMatchObject({
        id: 'undefined-0Action 2-1',
        title: 'Action 2',
        children: [],
      });
      act(() => emitOnActionSelected('undefined-0Action 1-0'));
      expect(action1OnPress).toHaveBeenCalledTimes(1);
      expect(action2OnPress).not.toHaveBeenCalled();
      act(() => emitOnActionSelected('undefined-0Action 2-1'));
      expect(action1OnPress).toHaveBeenCalledTimes(1);
      expect(action2OnPress).toHaveBeenCalledTimes(1);
    });
    describe('multiple Link.Menus in single Link', () => {
      it('when there are multiple Link.Menus, only the first one is rendered', () => {
        const NativeLinkPreviewAction = require('../preview/native').NativeLinkPreviewAction;
        renderRouter({
          index: () => {
            return (
              <Link prefetch href="/test">
                <Link.Preview />
                <Link.Trigger>Trigger</Link.Trigger>
                <Link.Menu>
                  <Link.MenuAction title="Menu-1-1" onPress={() => {}} />
                  <Link.MenuAction title="Menu-1-2" onPress={() => {}} />
                </Link.Menu>
                <Link.Menu>
                  <Link.MenuAction title="Menu-2-1" onPress={() => {}} />
                  <Link.MenuAction title="Menu-2-2" onPress={() => {}} />
                </Link.Menu>
              </Link>
            );
          },
          test: () => <View testID="test-view" />,
        });
        expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
        expect(screen.getAllByTestId('link-preview-native-action-view')).toHaveLength(3);
        expect(NativeLinkPreviewAction).toHaveBeenCalledTimes(3);
        expect(NativeLinkPreviewAction.mock.calls[0][0]).toEqual({
          id: 'undefined-0',
          title: '',
          children: [expect.any(Object), expect.any(Object)],
        });
        expect(NativeLinkPreviewAction.mock.calls[1][0]).toMatchObject({
          id: 'undefined-0Menu-1-1-0',
          title: 'Menu-1-1',
          children: [],
        });
        expect(NativeLinkPreviewAction.mock.calls[2][0]).toMatchObject({
          id: 'undefined-0Menu-1-2-1',
          title: 'Menu-1-2',
          children: [],
        });
      });
      it('when onActionSelected is called, correct press handler is called', () => {
        const indexIos = require('../preview/native');
        const NativeLinkPreviewAction = indexIos.NativeLinkPreviewAction;
        const emitters = indexIos.__EVENTS__;
        const action1OnPress = jest.fn();
        const action2OnPress = jest.fn();
        const emitOnActionSelected = (id: string) =>
          (emitters['link-onActionSelected'] as NativeLinkPreviewProps['onActionSelected'])({
            nativeEvent: { id },
          });

        renderRouter({
          index: () => {
            return (
              <View>
                <Link prefetch href="/test">
                  <Link.Preview />
                  <Link.Trigger>Trigger</Link.Trigger>
                  <Link.Menu>
                    <Link.MenuAction title="Action 1" onPress={action1OnPress} />
                    <Link.MenuAction title="Action 2" onPress={action2OnPress} />
                  </Link.Menu>
                  <Link.Menu>
                    <Link.MenuAction title="Action 3" onPress={action1OnPress} />
                    <Link.MenuAction title="Action 4" onPress={action2OnPress} />
                  </Link.Menu>
                </Link>
              </View>
            );
          },
          test: () => <View testID="test-view" />,
        });
        expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
        expect(screen.getAllByTestId('link-preview-native-action-view')).toHaveLength(3);
        expect(NativeLinkPreviewAction).toHaveBeenCalledTimes(3);
        expect(NativeLinkPreviewAction.mock.calls[0][0]).toEqual({
          id: 'undefined-0',
          title: '',
          children: [expect.any(Object), expect.any(Object)],
        });
        expect(NativeLinkPreviewAction.mock.calls[1][0]).toMatchObject({
          id: 'undefined-0Action 1-0',
          title: 'Action 1',
          children: [],
        });
        expect(NativeLinkPreviewAction.mock.calls[2][0]).toMatchObject({
          id: 'undefined-0Action 2-1',
          title: 'Action 2',
          children: [],
        });
        act(() => emitOnActionSelected('undefined-0Action 1-0'));
        expect(action1OnPress).toHaveBeenCalledTimes(1);
        expect(action2OnPress).not.toHaveBeenCalled();
        act(() => emitOnActionSelected('undefined-0Action 2-1'));
        expect(action1OnPress).toHaveBeenCalledTimes(1);
        expect(action2OnPress).toHaveBeenCalledTimes(1);
      });
    });
    describe('nested Link.Menus', () => {
      it('correctly creates nested menu actions', () => {
        const indexIos = require('../preview/native');
        const NativeLinkPreviewAction = indexIos.NativeLinkPreviewAction;
        const emitters = indexIos.__EVENTS__;
        const action1OnPress = jest.fn();
        const action2OnPress = jest.fn();
        const emitOnActionSelected = (id: string) =>
          (emitters['link-onActionSelected'] as NativeLinkPreviewProps['onActionSelected'])({
            nativeEvent: { id },
          });
        renderRouter({
          index: () => {
            return (
              <View>
                <Link prefetch href="/test">
                  <Link.Preview />
                  <Link.Trigger>Trigger</Link.Trigger>
                  <Link.Menu title="base menu">
                    <Link.MenuAction title="Action 1" onPress={action1OnPress} />
                    <Link.Menu title="Nested Menu">
                      <Link.MenuAction title="Action 2" onPress={action2OnPress} />
                    </Link.Menu>
                  </Link.Menu>
                </Link>
              </View>
            );
          },
          test: () => <View testID="test-view" />,
        });

        expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
        expect(screen.getAllByTestId('link-preview-native-action-view')).toHaveLength(4);

        expect(NativeLinkPreviewAction.mock.calls[0][0]).toEqual({
          id: 'base menu-0',
          title: 'base menu',
          children: [expect.any(Object), expect.any(Object)],
        });
        expect(NativeLinkPreviewAction.mock.calls[1][0]).toMatchObject({
          id: 'base menu-0Action 1-0',
          title: 'Action 1',
          children: [],
        });
        expect(NativeLinkPreviewAction.mock.calls[2][0]).toMatchObject({
          id: 'base menu-0Nested Menu-1',
          title: 'Nested Menu',
          children: [expect.any(Object)],
        });
        expect(NativeLinkPreviewAction.mock.calls[3][0]).toMatchObject({
          id: 'base menu-0Nested Menu-1Action 2-0',
          title: 'Action 2',
          children: [],
        });

        act(() => emitOnActionSelected('base menu-0Action 1-0'));
        expect(action1OnPress).toHaveBeenCalledTimes(1);
        expect(action2OnPress).not.toHaveBeenCalled();
        act(() => emitOnActionSelected('base menu-0Nested Menu-1Action 2-0'));
        expect(action1OnPress).toHaveBeenCalledTimes(1);
        expect(action2OnPress).toHaveBeenCalledTimes(1);
        act(() => emitOnActionSelected('base menu-0'));
        act(() => emitOnActionSelected('base menu-0Nested Menu-1'));
        expect(action1OnPress).toHaveBeenCalledTimes(1);
        expect(action2OnPress).toHaveBeenCalledTimes(1);
      });
    });
  });

  it('correctly passes props to child component with asChild, Preview and trigger', () => {
    const { getByText, getByTestId } = render(
      <LinkPreviewContextProvider>
        <Link asChild href="/foo">
          <Link.Preview />
          <Link.Trigger>
            <View testID="pressable">
              <Text testID="inner-text">Button</Text>
            </View>
          </Link.Trigger>
        </Link>
      </LinkPreviewContextProvider>
    );
    const node = getByText('Button');
    expect(node.props).toEqual({
      children: 'Button',
      testID: 'inner-text',
    });

    const pressable = getByTestId('pressable');
    if (Platform.OS === 'web') {
      expect(pressable.props).toEqual(
        expect.objectContaining({
          children: expect.anything(),
          href: '/foo',
          role: 'link',
          testID: 'pressable',
          onClick: expect.any(Function),
        })
      );
    } else {
      expect(pressable.props).toEqual(
        expect.objectContaining({
          children: expect.anything(),
          href: '/foo',
          role: 'link',
          testID: 'pressable',
          onPress: expect.any(Function),
        })
      );
    }
  });
  describe('changing href', () => {
    it('when preview is closed, href can change', () => {
      renderRouter({
        index: () => <ComponentWithButtonAndPreview href={(counter) => `/test/${counter}`} />,
        '/test/[counter]': ComponentWithCounter,
      });
      const button = screen.getByTestId('change-counter-button');
      expect(screen.getByTestId('component-with-button-and-preview')).toBeVisible();
      act(() => fireEvent.press(button));
      expect(screen.getByTestId('component-with-button-and-preview')).toBeVisible();
    });

    it('when preview is closed, query params in href can change', () => {
      renderRouter({
        index: () => (
          <ComponentWithButtonAndPreview href={(counter) => `/foo?counter=${counter}`} />
        ),
        foo: ComponentWithCounter,
      });
      const button = screen.getByTestId('change-counter-button');
      expect(screen.getByTestId('component-with-button-and-preview')).toBeVisible();
      act(() => fireEvent.press(button));
      expect(screen.getByTestId('component-with-button-and-preview')).toBeVisible();
    });

    it('when preview is open, href cannot change', () => {
      const emitters = require('../preview/native').__EVENTS__;
      renderRouter({
        index: () => <ComponentWithButtonAndPreview href={(counter) => `/test/${counter}`} />,
        '/test/[counter]': ComponentWithCounter,
      });
      act(() => emitters['link-onWillPreviewOpen']());
      const button = screen.getByTestId('change-counter-button');
      expect(screen.getByTestId('component-with-button-and-preview')).toBeVisible();
      expect(screen.getByTestId('counter-text')).toBeVisible();
      expect(() => act(() => fireEvent.press(button))).toThrow(
        'Link does not support changing the href prop after the preview has been opened. Please ensure that the href prop is stable and does not change between renders.'
      );
    });

    it('when preview is open, query params in href can change', () => {
      const emitters = require('../preview/native').__EVENTS__;
      renderRouter({
        index: () => (
          <ComponentWithButtonAndPreview href={(counter) => `/foo?counter=${counter}`} />
        ),
        foo: ComponentWithCounter,
      });
      act(() => emitters['link-onWillPreviewOpen']());
      const button = screen.getByTestId('change-counter-button');
      expect(screen.getByTestId('component-with-button-and-preview')).toBeVisible();
      expect(screen.getByTestId('counter-text')).toBeVisible();
      expect(screen.getByTestId('counter-text')).toHaveTextContent('Counter: 0');
      act(() => fireEvent.press(button));
      expect(screen.getByTestId('component-with-button-and-preview')).toBeVisible();
      expect(screen.getByTestId('counter-text')).toHaveTextContent('Counter: 1');
    });

    const ComponentWithCounter = () => {
      const { counter } = useLocalSearchParams();
      return <Text testID="counter-text">Counter: {counter}</Text>;
    };

    const ComponentWithButtonAndPreview = ({ href }: { href: (counter) => string }) => {
      const [counter, setCounter] = React.useState(0);
      return (
        <View testID="component-with-button-and-preview">
          <Button
            title="Change counter"
            onPress={() => setCounter((c) => c + 1)}
            testID="change-counter-button"
          />
          <Link href={href(counter)} testID="link" onPress={() => setCounter((c) => c + 1)}>
            <Link.Preview />
            <Link.Trigger>
              <Text>Counter: {counter}</Text>
            </Link.Trigger>
            <Link.Preview />
          </Link>
        </View>
      );
    };
  });
  describe('multiple preloaded paths with the same name', () => {
    it('when there are three paths with the same name and all are preloaded, returns correct nextScreenId', () => {
      const NativeLinkPreview = require('../preview/native').NativeLinkPreview;
      const emitters = require('../preview/native').__EVENTS__;
      function Index() {
        const router = useRouter();
        const navigation = useNavigation();
        const preloadAandC = () => {
          router.prefetch('/slotA/test');
          router.prefetch('/slotC/test');
        };
        return (
          <View testID="index">
            <Button title="Preload A and C" onPress={preloadAandC} testID="preload-button" />
            <Link prefetch href="/slotB/test">
              <Link.Preview />
              <Link.Trigger>/slotB/test</Link.Trigger>
            </Link>
          </View>
        );
      }
      renderRouter({
        index: Index,
        'slotA/_layout': () => <Slot />,
        'slotB/_layout': () => <Slot />,
        'slotC/_layout': () => <Slot />,
        'slotA/test': () => <View testID="slotA-test" />,
        'slotB/test': () => <View testID="slotB-test" />,
        'slotC/test': () => <View testID="slotC-test" />,
      });
      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
      act(() => fireEvent.press(screen.getByTestId('index')));
      act(() => fireEvent.press(screen.getByText('Preload A and C')));
      act(() => emitters['link-onWillPreviewOpen']());
      act(() => emitters['link-onDidPreviewOpen']());
      expect(screen.getByTestId('slotB-test')).toBeVisible();
      // Initial render, onWillPreviewOpen and onDidPreviewOpen
      expect(NativeLinkPreview).toHaveBeenCalledTimes(3);
      expect(
        NativeLinkPreview.mock.calls[NativeLinkPreview.mock.calls.length - 1][0].nextScreenId
      ).toMatch(/slotB-\w+/);
    });
    it('when there are three paths with the same name and all are preloaded, returns correct nextScreenId', () => {
      const NativeLinkPreview = require('../preview/native').NativeLinkPreview;
      const emitters = require('../preview/native').__EVENTS__;
      function Index() {
        const router = useRouter();
        const navigation = useNavigation();
        const preloadOtherRoutes = () => {
          router.prefetch('/slotA/test0/test');
          router.prefetch('/slotC/test0/test');
        };
        return (
          <View testID="index">
            <Button
              title="Preload Other Routes"
              onPress={preloadOtherRoutes}
              testID="preload-button"
            />
            <Link prefetch href="/slotB/test0/test">
              <Link.Preview />
              <Link.Trigger>/slotB/test0/test</Link.Trigger>
            </Link>
          </View>
        );
      }
      renderRouter({
        index: Index,
        'slotA/[xyz]/_layout': () => <Slot />,
        'slotB/[xyz]/_layout': () => <Slot />,
        'slotC/[xyz]/_layout': () => <Slot />,
        'slotA/[xyz]/test': () => <View testID="slotA-test" />,
        'slotB/[xyz]/test': () => <View testID="slotB-test" />,
        'slotC/[xyz]/test': () => <View testID="slotC-test" />,
      });
      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
      act(() => fireEvent.press(screen.getByTestId('index')));
      act(() => fireEvent.press(screen.getByText('Preload Other Routes')));
      act(() => emitters['link-onWillPreviewOpen']());
      act(() => emitters['link-onDidPreviewOpen']());

      expect(screen.getByTestId('slotB-test')).toBeVisible();
      // Initial render, onWillPreviewOpen and onDidPreviewOpen
      expect(NativeLinkPreview).toHaveBeenCalledTimes(3);
      expect(
        NativeLinkPreview.mock.calls[NativeLinkPreview.mock.calls.length - 1][0].nextScreenId
      ).toMatch(/slotB\/\[xyz\]-\w+/);
    });
  });
});

describe('Link.Trigger', () => {
  it('renders a Link.Trigger with single text child', () => {
    renderRouter({
      index: () => (
        <Link href="/test">
          <Link.Trigger>Test</Link.Trigger>
        </Link>
      ),
      test: () => <View testID="test-page" />,
    });
    expect(screen.getByText('Test')).toBeVisible();
    const linkTrigger = screen.getByText('Test');
    act(() => fireEvent.press(linkTrigger));
    expect(screen.getByTestId('test-page')).toBeVisible();
  });
  it('renders a Link.Trigger with single child', () => {
    renderRouter({
      index: () => (
        <Link href="/test">
          <Link.Trigger>
            <View>
              <Text>Test</Text>
            </View>
          </Link.Trigger>
        </Link>
      ),
      test: () => <View testID="test-page" />,
    });
    expect(screen.getByText('Test')).toBeVisible();
    const linkTrigger = screen.getByText('Test');
    act(() => fireEvent.press(linkTrigger));
    expect(screen.getByTestId('test-page')).toBeVisible();
  });
  it('renders a Link.Trigger with multiple children', () => {
    renderRouter({
      index: () => (
        <Link href="/test">
          <Link.Trigger>
            <View>
              <Text>Test</Text>
            </View>
            <View>
              <Text>Another child</Text>
            </View>
          </Link.Trigger>
        </Link>
      ),
      test: () => <View testID="test-page" />,
    });
    expect(screen.getByText('Test')).toBeVisible();
    const linkTrigger = screen.getByText('Test');
    act(() => fireEvent.press(linkTrigger));
    expect(screen.getByTestId('test-page')).toBeVisible();
  });
  it('renders a Link.Trigger with single child in asChild', () => {
    renderRouter({
      index: () => (
        <Link href="/test">
          <Link.Trigger>
            <Pressable testID="pressable">
              <Text>Test</Text>
            </Pressable>
          </Link.Trigger>
        </Link>
      ),
      test: () => <View testID="test-page" />,
    });
    expect(screen.getByText('Test')).toBeVisible();
    const linkTrigger = screen.getByText('Test');
    act(() => fireEvent.press(linkTrigger));
    expect(screen.getByTestId('test-page')).toBeVisible();
  });
  it('throws an error when a Link.Trigger with multiple children is used in asChild', () => {
    expect(() =>
      renderRouter({
        index: () => (
          <Link href="/test" asChild>
            <Link.Trigger>
              <Pressable testID="pressable">
                <Text>Test</Text>
              </Pressable>
              <Text>Another child</Text>
            </Link.Trigger>
          </Link>
        ),
        test: () => <View testID="test-page" />,
      })
    ).toThrow(
      'When using Link.Trigger in an asChild Link, you must pass a single child element that will emit onPress event.'
    );
  });
  it('throws an error when a Link.Trigger with text is used in asChild', () => {
    expect(() =>
      renderRouter({
        index: () => (
          <Link href="/test" asChild>
            <Link.Trigger>Test</Link.Trigger>
          </Link>
        ),
        test: () => <View testID="test-page" />,
      })
    ).toThrow(
      'When using Link.Trigger in an asChild Link, you must pass a single child element that will emit onPress event.'
    );
  });
});

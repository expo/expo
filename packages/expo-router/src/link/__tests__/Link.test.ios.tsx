import { act, fireEvent, render } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';
import { Button, Platform, Text, View } from 'react-native';

import { router } from '../../imperative-api';
import Stack from '../../layouts/Stack';
import { renderRouter, screen } from '../../testing-library';
import { Pressable } from '../../views/Pressable';
import { Link } from '../Link';
import { LinkPreviewContextProvider } from '../preview/LinkPreviewContext';
import type { LinkPreviewNativeViewProps } from '../preview/native/types';
import { useLocalSearchParams } from '../../hooks';

// Render and observe the props of the Link component.

jest.mock('../preview/native/index.ios', () => {
  const { View, Pressable } = require('react-native');
  return {
    LinkPreviewNativeView: jest.fn(
      ({ children, onWillPreviewOpen }: LinkPreviewNativeViewProps) => (
        <Pressable
          testID="link-preview-native-view"
          children={children}
          onPress={onWillPreviewOpen}
        />
      )
    ),
    LinkPreviewNativePreviewView: jest.fn(({ children }: PropsWithChildren) => (
      <View testID="link-preview-native-preview-view" children={children} />
    )),
    LinkPreviewNativeTriggerView: jest.fn(({ children }: PropsWithChildren) => (
      <View testID="link-preview-native-trigger-view" children={children} />
    )),
    LinkPreviewNativeActionView: jest.fn(({ children }: PropsWithChildren) => (
      <View testID="link-preview-native-action-view" children={children} />
    )),
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
  it('when experimentalPreview is false and Link.Preview is not used, does not render LinkNativeView, LinkNativePreview and LinkNativeTrigger', () => {
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
  it('when experimentalPreview is true, renders LinkNativeView, LinkNativePreview and LinkNativeTrigger', () => {
    renderRouter({
      index: () => {
        return <Link prefetch href="/test" experimentalPreview />;
      },
      test: () => null,
    });
    expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
    expect(screen.getByTestId('link-preview-native-preview-view')).toBeVisible();
    expect(screen.getByTestId('link-preview-native-trigger-view')).toBeVisible();
  });
  it('when experimentalPreview is false and Link.Preview is used, renders LinkNativeView, LinkNativePreview and LinkNativeTrigger', () => {
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
  it('when experimentalPreview is true and no trigger is used, renders link correctly', () => {
    renderRouter({
      index: () => {
        return (
          <Link prefetch href="/test" experimentalPreview>
            <View testID="inner-view" />
          </Link>
        );
      },
      test: () => null,
    });
    expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
    expect(screen.getByTestId('link-preview-native-preview-view')).toBeVisible();
    expect(screen.getByTestId('link-preview-native-trigger-view')).toBeVisible();
    expect(screen.getByTestId('inner-view')).toBeVisible();
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
  it('when experimentalPreview is true and trigger is used, renders link correctly', () => {
    renderRouter({
      index: () => {
        return (
          <Link prefetch href="/test" experimentalPreview>
            <Link.Trigger>
              <View testID="inner-view" />
            </Link.Trigger>
          </Link>
        );
      },
      test: () => null,
    });
    expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
    expect(screen.getByTestId('link-preview-native-preview-view')).toBeVisible();
    expect(screen.getByTestId('link-preview-native-trigger-view')).toBeVisible();
    expect(screen.getByTestId('inner-view')).toBeVisible();
  });
  describe('lazy loading', () => {
    it('when using default preview, it is not visible on initial load', () => {
      renderRouter({
        index: () => {
          return <Link prefetch href="/test" experimentalPreview />;
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
      act(() => fireEvent.press(screen.getByTestId('link-preview-native-view')));
      expect(screen.getByTestId('preview')).toBeVisible();
    });
    it('when LinkNativeView emits onWillPreviewOpen, it loads the default preview', () => {
      renderRouter({
        index: () => {
          return <Link prefetch href="/test" experimentalPreview />;
        },
        test: () => <View testID="test-view" />,
      });
      expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
      act(() => fireEvent.press(screen.getByTestId('link-preview-native-view')));
      expect(screen.getByTestId('test-view')).toBeVisible();
    });
  });
  it('when Link.Menu items are passed, correct actions are passed to native', () => {
    const LinkPreviewNativeActionView =
      require('../preview/native/index.ios').LinkPreviewNativeActionView;
    renderRouter({
      index: () => {
        return (
          <Link prefetch href="/test" experimentalPreview>
            <Link.Trigger>Trigger</Link.Trigger>
            <Link.Menu>
              <Link.MenuItem
                title="Test Item"
                onPress={() => {
                  // Handle menu item press
                }}
              />
              <Text>Text child</Text>
              <Link.MenuItem
                title="Second actions"
                onPress={() => {
                  // Handle menu item press
                }}
              />
            </Link.Menu>
          </Link>
        );
      },
      test: () => <View testID="test-view" />,
    });
    expect(screen.getByTestId('link-preview-native-view')).toBeVisible();
    expect(screen.getAllByTestId('link-preview-native-action-view')).toHaveLength(2);
    expect(LinkPreviewNativeActionView.mock.calls[0][0]).toEqual({
      id: 'Test Item',
      title: 'Test Item',
    });
    expect(LinkPreviewNativeActionView.mock.calls[1][0]).toEqual({
      id: 'Second actions',
      title: 'Second actions',
    });
  });
  it('correctly passes props to child component with asChild and experimentalPreview', () => {
    const { getByText, getByTestId } = render(
      <LinkPreviewContextProvider>
        <Link asChild href="/foo" experimentalPreview>
          <View testID="pressable">
            <Text testID="inner-text">Button</Text>
          </View>
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
  it('correctly passes props to child component with asChild, experimentalPreview and trigger', () => {
    const { getByText, getByTestId } = render(
      <LinkPreviewContextProvider>
        <Link asChild href="/foo" experimentalPreview>
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
      renderRouter({
        index: () => <ComponentWithButtonAndPreview href={(counter) => `/test/${counter}`} />,
        '/test/[counter]': ComponentWithCounter,
      });
      act(() => fireEvent.press(screen.getByTestId('link-preview-native-view')));
      const button = screen.getByTestId('change-counter-button');
      expect(screen.getByTestId('component-with-button-and-preview')).toBeVisible();
      expect(screen.getByTestId('counter-text')).toBeVisible();
      expect(() => act(() => fireEvent.press(button))).toThrow(
        'Link does not support changing the href prop after the preview has been opened. Please ensure that the href prop is stable and does not change between renders.'
      );
    });

    it('when preview is open, query params in href can change', () => {
      renderRouter({
        index: () => (
          <ComponentWithButtonAndPreview href={(counter) => `/foo?counter=${counter}`} />
        ),
        foo: ComponentWithCounter,
      });
      act(() => fireEvent.press(screen.getByTestId('link-preview-native-view')));
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
          <Link
            href={href(counter)}
            experimentalPreview
            testID="link"
            onPress={() => setCounter((c) => c + 1)}>
            <Link.Trigger>
              <Text>Counter: {counter}</Text>
            </Link.Trigger>
            <Link.Preview />
          </Link>
        </View>
      );
    };
  });
});

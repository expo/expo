import type { NavigationProp } from '@react-navigation/native';
import { screen } from '@testing-library/react-native';
import React, { useEffect, type PropsWithChildren } from 'react';
import { View, Text } from 'react-native';
import { ScreenStackItem as _ScreenStackItem } from 'react-native-screens';

import { useCompositionOption } from '../../../fork/native-stack/composition-options';
import {
  useGlobalSearchParams,
  useLocalSearchParams,
  usePathname,
  useRouter,
  useSegments,
} from '../../../hooks';
import { Stack } from '../../../layouts/Stack';
import { renderRouter } from '../../../testing-library';
import { useNavigation } from '../../../useNavigation';
import { Redirect } from '../../Redirect';
import { HrefPreview } from '../HrefPreview';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;

afterEach(() => {
  ScreenStackItem.mockClear();
});

it.each([
  { visible: 'foo', hidden: 'bar' },
  { visible: 'bar', hidden: 'foo' },
])('renders preview for $visible href', async ({ visible, hidden }) => {
  renderRouter({
    index: () => (
      <View testID="index">
        <HrefPreview href={`/${visible}`} />
      </View>
    ),
    foo: () => <View testID="foo" />,
    bar: () => <View testID="bar" />,
  });

  expect(screen.getByTestId(visible)).toBeVisible();
  expect(screen.queryByTestId(hidden)).toBeFalsy();
});

it.each([
  { visible: 'foo', hidden: 'foo/bar' },
  { visible: 'foo/bar', hidden: 'foo' },
])('renders preview for $visible in nested stack href', async ({ visible, hidden }) => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <View testID="index">
        <HrefPreview href={`/${visible}`} />
      </View>
    ),
    'foo/_layout': () => <Stack />,
    'foo/index': () => <View testID="foo" />,
    'foo/bar': () => <View testID="foo/bar" />,
  });

  expect(screen.getByTestId(visible)).toBeVisible();
  expect(await screen.queryByTestId(hidden)).toBeFalsy();
});

it.each([
  { paramA: 'foo', paramB: 'bar' },
  { paramA: '123', paramB: 'aBcD' },
])(
  'renders preview for route with params [paramA=$paramA, paramB=$paramB]',
  async ({ paramA, paramB }) => {
    const ParamsComponent = () => {
      const globalParams = useGlobalSearchParams();
      const localParams = useLocalSearchParams();
      return (
        <View testID="params-route">
          <Text testID="local-paramA">{localParams.paramA}</Text>
          <Text testID="local-paramB">{localParams.paramB}</Text>
          <Text testID="global-paramA">{globalParams.paramA}</Text>
          <Text testID="global-paramB">{globalParams.paramB}</Text>
        </View>
      );
    };
    renderRouter({
      index: () => (
        <View testID="index">
          <HrefPreview href={`/${paramA}/${paramB}`} />
        </View>
      ),
      '[paramA]/[paramB]': ParamsComponent,
    });

    expect(screen.getByTestId('params-route')).toBeVisible();
    expect(screen.getByTestId('local-paramA')).toHaveTextContent(paramA);
    expect(screen.getByTestId('local-paramB')).toHaveTextContent(paramB);
    expect(screen.getByTestId('global-paramA')).toHaveTextContent(paramA);
    expect(screen.getByTestId('global-paramB')).toHaveTextContent(paramB);
  }
);

it('renders correct preview for relative path', () => {
  renderRouter(
    {
      index: () => <View testID="index" />,
      'inner/_layout': () => <Stack />,
      'inner/index': () => (
        <View testID="inner">
          <HrefPreview href="../foo" />
        </View>
      ),
      foo: () => <View testID="foo" />,
      bar: () => <View testID="bar" />,
    },
    { initialUrl: '/inner' }
  );

  expect(screen.getByTestId('inner')).toBeVisible();
  expect(screen.getByTestId('foo')).toBeVisible();
  expect(screen.queryByTestId('bar')).toBeFalsy();
});

it('usePathname() returns the correct path', async () => {
  const FooComponent = () => {
    const pathname = usePathname();
    return (
      <View>
        <Text testID="pathname">{pathname}</Text>
      </View>
    );
  };
  renderRouter({
    index: () => (
      <View testID="index">
        <HrefPreview href="/foo" />
      </View>
    ),
    foo: FooComponent,
  });

  expect(screen.getByTestId('pathname')).toBeVisible();
  expect(screen.getByTestId('pathname')).toHaveTextContent('/foo');
});

it('useSegments() returns the correct path', async () => {
  const FooComponent = () => {
    const segments = useSegments();
    return (
      <View>
        <Text testID="segments">{JSON.stringify(segments)}</Text>
      </View>
    );
  };
  renderRouter({
    index: () => (
      <View testID="index">
        <HrefPreview href="/foo" />
      </View>
    ),
    foo: FooComponent,
  });

  expect(screen.getByTestId('segments')).toBeVisible();
  expect(screen.getByTestId('segments')).toHaveTextContent(JSON.stringify(['foo']));
});

describe('useNavigation in preview', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('navigation.navigate navigates in host view', async () => {
    const NavigationSetter = ({ children }: PropsWithChildren) => {
      const navigation = useNavigation<NavigationProp<{ foo: unknown }>>();
      useEffect(() => {
        navigation.navigate('foo');
      }, []);
      return <View testID="nav-setter">{children}</View>;
    };
    renderRouter({
      index: () => (
        <NavigationSetter>
          <HrefPreview href="/preview" />
        </NavigationSetter>
      ),
      preview: () => <View testID="preview" />,
      foo: () => <View testID="foo" />,
    });

    expect(screen.getByTestId('foo')).toBeVisible();
    expect(screen.queryByTestId('index')).toBeFalsy();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('navigation.navigate does not navigate in preview', async () => {
    const NavigationSetter = ({ children }: PropsWithChildren) => {
      const navigation = useNavigation<NavigationProp<{ foo: unknown }>>();
      useEffect(() => {
        navigation.navigate('foo');
      }, []);
      return <View testID="nav-setter">{children}</View>;
    };
    renderRouter({
      index: () => (
        <View testID="index">
          <HrefPreview href="/preview" />,
        </View>
      ),
      preview: () => <NavigationSetter />,
      foo: () => <View testID="foo" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('foo')).toBeFalsy();
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenLastCalledWith(
      "navigation.navigate should not be used in a previewed screen. To fix this issue, wrap navigation calls with 'if (!isPreview) { ... }'."
    );
  });
});

describe('useRouter in preview', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('Redirect should redirect in host view', async () => {
    renderRouter({
      index: () => (
        <View testID="index">
          <Redirect href="/foo" />
          <HrefPreview href="/preview" />
        </View>
      ),
      preview: () => <View testID="preview" />,
      foo: () => <View testID="foo" />,
    });

    expect(screen.getByTestId('foo')).toBeVisible();
    expect(screen.queryByTestId('index')).toBeFalsy();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('Redirect should not redirect in preview', async () => {
    renderRouter({
      index: () => (
        <View testID="index">
          <HrefPreview href="/preview" />
        </View>
      ),
      preview: () => <Redirect href="/foo" />,
      foo: () => <View testID="foo" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('foo')).toBeFalsy();
  });

  it('router.push should not push in preview', async () => {
    const ComponentWithPush = () => {
      const router = useRouter();
      useEffect(() => {
        router.push('/foo');
      }, [router]);
      return <View testID="component-with-push" />;
    };
    renderRouter({
      index: () => (
        <View testID="index">
          <HrefPreview href="/preview" />
        </View>
      ),
      preview: ComponentWithPush,
      foo: () => <View testID="foo" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('foo')).toBeFalsy();
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenLastCalledWith(
      "router.push should not be used in a previewed screen. To fix this issue, wrap navigation calls with 'if (!isPreview) { ... }'."
    );
  });
});

it('Renders not found for not existing href', async () => {
  renderRouter({
    index: () => (
      <View testID="index">
        <HrefPreview href="/preview" />
      </View>
    ),
    '+not-found': () => <View testID="not-found" />,
    foo: () => <View testID="foo" />,
  });

  expect(screen.getByTestId('not-found')).toBeVisible();
});

describe('Setting Stack.Screen options in preview', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('can use Stack.Screen inside screen presented in HrefPreview', () => {
    const headerTitle = jest.fn(() => null);
    renderRouter({
      _layout: () => <Stack screenOptions={{ headerTitle }} />,
      index: () => (
        <View testID="index">
          <HrefPreview href="/preview" />
        </View>
      ),
      preview: () => (
        <View testID="preview">
          <Stack.Screen options={{ title: 'preview', headerShown: true }} />
        </View>
      ),
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('preview')).toBeVisible();
    expect(headerTitle.mock.calls).toStrictEqual([
      [{ tintColor: 'rgb(0, 122, 255)', children: 'index' }],
      [{ tintColor: 'rgb(0, 122, 255)', children: 'index' }],
    ]);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});

describe('Stack Composition API', () => {
  it('does not throw when useCompositionOption is directly called inside HrefPreview', () => {
    function PreviewScreen() {
      useCompositionOption({ title: 'Direct Hook Title' });
      return <View testID="preview" />;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => (
        <View testID="index">
          <HrefPreview href="/preview" />
        </View>
      ),
      preview: PreviewScreen,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('preview')).toBeVisible();
  });

  it('does not set options when useCompositionOption is directly called inside HrefPreview', () => {
    function PreviewScreen() {
      useCompositionOption({ title: 'Direct Hook Title' });
      return <View testID="preview" />;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => (
        <View testID="index">
          <HrefPreview href="/preview" />
        </View>
      ),
      preview: PreviewScreen,
    });

    // Only one ScreenStackItem call (initial render for the index screen)
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);
    // Index screen title is unchanged — preview composition options did not leak
    expect(ScreenStackItem.mock.calls[0][0].headerConfig?.title).toBe('index');
  });

  const cases = [
    {
      name: 'Stack.Screen.Title',
      component: () => <Stack.Screen.Title>Preview Title</Stack.Screen.Title>,
    },
    {
      name: 'Stack.Screen.BackButton',
      component: () => <Stack.Screen.BackButton hidden />,
    },
    {
      name: 'Stack.Header',
      component: () => <Stack.Header hidden />,
    },
    {
      name: 'Stack.SearchBar',
      component: () => <Stack.SearchBar placeholder="Search" />,
    },
    {
      name: 'Stack.Toolbar (right)',
      component: () => (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button onPress={() => {}} />
        </Stack.Toolbar>
      ),
    },
    {
      name: 'Stack.Toolbar (bottom)',
      component: () => (
        <Stack.Toolbar>
          <Stack.Toolbar.Button onPress={() => {}} />
        </Stack.Toolbar>
      ),
    },
  ];

  it.each(cases)(
    'does not throw when $name is used inside HrefPreview',
    ({ component: CompositionComponent }) => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <View testID="index">
            <HrefPreview href="/preview" />
          </View>
        ),
        preview: () => (
          <View testID="preview">
            <CompositionComponent />
          </View>
        ),
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen.getByTestId('preview')).toBeVisible();
    }
  );

  it.each(cases)(
    'does not set options when $name is used inside HrefPreview',
    ({ component: CompositionComponent }) => {
      renderRouter({
        _layout: () => <Stack />,
        index: () => (
          <View testID="index">
            <HrefPreview href="/preview" />
          </View>
        ),
        preview: () => (
          <View testID="preview">
            <CompositionComponent />
          </View>
        ),
      });

      // Only one ScreenStackItem call (initial render for the index screen)
      expect(ScreenStackItem).toHaveBeenCalledTimes(1);
      // Index screen title is unchanged — preview composition options did not leak
      expect(ScreenStackItem.mock.calls[0][0].headerConfig?.title).toBe('index');
    }
  );
});

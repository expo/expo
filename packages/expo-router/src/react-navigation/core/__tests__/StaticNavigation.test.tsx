import { expect, test } from '@jest/globals';
import type {
  DefaultRouterOptions,
  NavigationState,
  ParamListBase,
} from '../../routers';
import { act, render } from '@testing-library/react-native';
import assert from 'assert';
import * as React from 'react';

import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { createNavigatorFactory } from '../createNavigatorFactory';
import { getStateFromPath } from '../getStateFromPath';
import {
  createPathConfigForStaticNavigation,
  type StaticConfig,
  type StaticParamList,
} from '../StaticNavigation';
import type {
  DefaultNavigatorOptions,
  EventMapBase,
  TypedNavigator,
} from '../types';
import { useIsFocused } from '../useIsFocused';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { MockRouter } from './__fixtures__/MockRouter';

type TestNavigatorScreenOptions = {
  className?: string;
  testId?: string;
  title?: string;
};

type TestNavigatorProps = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  NavigationState,
  TestNavigatorScreenOptions,
  EventMapBase,
  unknown
>;

const TestNavigator = (props: TestNavigatorProps) => {
  const { state, descriptors, NavigationContent } = useNavigationBuilder<
    NavigationState,
    DefaultRouterOptions,
    {},
    TestNavigatorScreenOptions,
    EventMapBase
  >(MockRouter, props);

  return (
    <NavigationContent>
      <main>
        {state.routes.map((route) => {
          const descriptor = descriptors[route.key];

          return (
            <div
              key={route.key}
              className={descriptor.options?.className}
              data-testid={descriptor.options?.testId}
            >
              {descriptor.render()}
            </div>
          );
        })}
      </main>
    </NavigationContent>
  );
};

type TestNavigatorTypeBag<ParamList extends {}> = {
  ParamList: ParamList;
  NavigatorID: string | undefined;
  State: NavigationState;
  ScreenOptions: TestNavigatorScreenOptions;
  EventMap: EventMapBase;
  NavigationList: {
    [RouteName in keyof ParamList]: unknown;
  };
  Navigator: typeof TestNavigator;
};

function createTestNavigator<
  const ParamList extends ParamListBase,
>(): TypedNavigator<TestNavigatorTypeBag<ParamList>, undefined>;
function createTestNavigator<
  const Config extends StaticConfig<TestNavigatorTypeBag<ParamListBase>>,
>(
  config: Config
): TypedNavigator<
  TestNavigatorTypeBag<StaticParamList<{ config: Config }>>,
  Config
>;
function createTestNavigator(config?: unknown) {
  return createNavigatorFactory(TestNavigator)(config);
}

const TestScreen = ({ route }: any) => {
  const isFocused = useIsFocused();

  return (
    <>
      Screen:{route.name}
      {isFocused ? '(focused)' : null}
    </>
  );
};

test('renders the specified nested navigator configuration', () => {
  const Nested = createTestNavigator({
    screens: {
      Profile: TestScreen,
      Settings: {
        screen: TestScreen,
        options: {
          testId: 'settings',
        },
      },
    },
  });

  const Root = createTestNavigator({
    initialRouteName: 'Nested',
    screenOptions: {
      className: 'root-screen',
    },
    screens: {
      Home: TestScreen,
      Feed: {
        screen: TestScreen,
        if: () => false,
      },
      Nested: {
        screen: Nested,
        if: () => true,
      },
    },
  });

  const RootComponent = Root.getComponent();

  const element = render(
    <BaseNavigationContainer>
      <RootComponent />
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`
    <main>
      <div
        className="root-screen"
      >
        Screen:
        Home
      </div>
      <div
        className="root-screen"
      >
        <main>
          <div>
            Screen:
            Profile
            (focused)
          </div>
          <div
            data-testid="settings"
          >
            Screen:
            Settings
          </div>
        </main>
      </div>
    </main>
  `);
});

test('renders the specified nested navigator configuration with groups', () => {
  const Nested = createTestNavigator({
    screens: {
      Profile: TestScreen,
      Settings: TestScreen,
    },
  });

  const Root = createTestNavigator({
    initialRouteName: 'Nested',
    screens: {
      Home: TestScreen,
    },
    groups: {
      Auth: {
        if: () => false,
        screens: {
          Login: TestScreen,
          Register: TestScreen,
          Forgot: {
            screen: TestScreen,
            if: () => true,
          },
        },
      },
      Main: {
        if: () => true,
        screenOptions: {
          className: 'main-screen',
        },
        screens: {
          Nested: Nested,
          Feed: {
            screen: TestScreen,
            options: {
              testId: 'feed',
            },
          },
          Details: {
            screen: TestScreen,
            if: () => false,
          },
        },
      },
    },
  });

  const RootComponent = Root.getComponent();

  const element = render(
    <BaseNavigationContainer>
      <RootComponent />
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`
    <main>
      <div>
        Screen:
        Home
      </div>
      <div
        className="main-screen"
      >
        <main>
          <div>
            Screen:
            Profile
            (focused)
          </div>
          <div>
            Screen:
            Settings
          </div>
        </main>
      </div>
      <div
        className="main-screen"
        data-testid="feed"
      >
        Screen:
        Feed
      </div>
    </main>
  `);
});

test('handles conditional groups with nested if hooks', () => {
  const useShowNested = () => {
    return React.useSyncExternalStore(
      (subscriber) => {
        onUpdate = subscriber;

        return () => {
          onUpdate = undefined;
        };
      },
      () => showNested,
      () => showNested
    );
  };

  const createUseTest = (value: boolean) => () => {
    // Use a hook to test that it follows rules of hooks
    const [state] = React.useState(value);

    return state;
  };

  const Root = createTestNavigator({
    groups: {
      User: {
        if: useShowNested,
        screens: {
          Profile: TestScreen,
          Settings: {
            screen: TestScreen,
            if: createUseTest(true),
          },
        },
      },
      Guest: {
        screens: {
          Feed: TestScreen,
          Details: {
            screen: TestScreen,
            if: createUseTest(false),
          },
        },
      },
    },
  });

  let onUpdate: (() => void) | undefined;
  let showNested = true;

  const RootComponent = Root.getComponent();

  const element = (
    <BaseNavigationContainer>
      <RootComponent />
    </BaseNavigationContainer>
  );

  const root = render(element);

  expect(root).toMatchInlineSnapshot(`
<main>
  <div>
    Screen:
    Profile
    (focused)
  </div>
  <div>
    Screen:
    Settings
  </div>
  <div>
    Screen:
    Feed
  </div>
</main>
`);

  act(() => {
    showNested = false;
    onUpdate?.();
  });

  root.rerender(element);

  expect(root).toMatchInlineSnapshot(`
<main>
  <div>
    Screen:
    Feed
    (focused)
  </div>
</main>
`);
});

test('handles non-function screens', () => {
  expect(() => {
    // eslint-disable-next-line @eslint-react/no-useless-forward-ref, @eslint-react/ensure-forward-ref-using-ref, @eslint-react/no-missing-component-display-name
    const TestScreen = React.forwardRef(() => null);

    const Root = createTestNavigator({
      screens: {
        Home: TestScreen,
        Settings: {
          screen: TestScreen,
        },
      },
    });

    const RootComponent = Root.getComponent();

    render(
      <BaseNavigationContainer>
        <RootComponent />
      </BaseNavigationContainer>
    );
  }).not.toThrow();
});

test("throws if screens or groups property isn't specified", () => {
  expect(() => {
    // @ts-expect-error: invalid static config for runtime error test
    createTestNavigator({});
  }).toThrow("Couldn't find a 'screens' or 'groups' property");
});

test('throws if no screens are specified', () => {
  expect(() => {
    createTestNavigator({
      screens: {},
    });
  }).toThrow("Couldn't find any screens in the 'screens' or 'groups' property");

  expect(() => {
    createTestNavigator({
      groups: {},
    });
  }).toThrow("Couldn't find any screens in the 'screens' or 'groups' property");

  expect(() => {
    createTestNavigator({
      screens: {},
      groups: {},
    });
  }).toThrow("Couldn't find any screens in the 'screens' or 'groups' property");
});

test('renders the initial screen based on the order of screens', () => {
  const A = createTestNavigator({
    screens: {
      Home: TestScreen,
    },
    groups: {
      Help: {
        screens: {
          Help: TestScreen,
        },
      },
    },
  });

  const AComponent = A.getComponent();

  expect(
    render(
      <BaseNavigationContainer>
        <AComponent />
      </BaseNavigationContainer>
    )
  ).toMatchInlineSnapshot(`
<main>
  <div>
    Screen:
    Home
    (focused)
  </div>
  <div>
    Screen:
    Help
  </div>
</main>
`);

  const B = createTestNavigator({
    groups: {
      Help: {
        screens: {
          Help: TestScreen,
        },
      },
    },
    screens: {
      Home: TestScreen,
    },
  });

  const BComponent = B.getComponent();

  expect(
    render(
      <BaseNavigationContainer>
        <BComponent />
      </BaseNavigationContainer>
    )
  ).toMatchInlineSnapshot(`
<main>
  <div>
    Screen:
    Help
    (focused)
  </div>
  <div>
    Screen:
    Home
  </div>
</main>
`);
});

test('passes additional props and options to the navigator component', () => {
  const Root = createTestNavigator({
    initialRouteName: 'Feed',
    screenOptions: {
      className: 'root-screen',
    },
    screens: {
      Home: TestScreen,
      Feed: TestScreen,
      Profile: TestScreen,
    },
  });

  const RootComponent = Root.getComponent();

  expect(
    render(
      <BaseNavigationContainer>
        <RootComponent
          initialRouteName="Profile"
          screenOptions={{ testId: 'my-test-id' }}
        />
      </BaseNavigationContainer>
    )
  ).toMatchInlineSnapshot(`
    <main>
      <div
        className="root-screen"
        data-testid="my-test-id"
      >
        Screen:
        Home
      </div>
      <div
        className="root-screen"
        data-testid="my-test-id"
      >
        Screen:
        Feed
      </div>
      <div
        className="root-screen"
        data-testid="my-test-id"
      >
        Screen:
        Profile
        (focused)
      </div>
    </main>
  `);
});

test('renders wrapped navigator and merges options objects', () => {
  const Root = createTestNavigator({
    initialRouteName: 'Feed',
    screenOptions: {
      className: 'config-class',
      testId: 'config-test-id',
    },
    screens: {
      Feed: TestScreen,
      Profile: TestScreen,
      Settings: TestScreen,
    },
  }).with(({ Navigator }) => {
    return (
      <section data-testid="root-wrapper">
        <Navigator
          initialRouteName="Profile"
          screenOptions={{ testId: 'navigator-test-id' }}
        />
      </section>
    );
  });

  expect(Root).not.toHaveProperty('with');

  const RootComponent = Root.getComponent();

  const element = render(
    <BaseNavigationContainer>
      <RootComponent />
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`
    <section
      data-testid="root-wrapper"
    >
      <main>
        <div
          className="config-class"
          data-testid="navigator-test-id"
        >
          Screen:
          Feed
        </div>
        <div
          className="config-class"
          data-testid="navigator-test-id"
        >
          Screen:
          Profile
          (focused)
        </div>
        <div
          className="config-class"
          data-testid="navigator-test-id"
        >
          Screen:
          Settings
        </div>
      </main>
    </section>
  `);
});

test('renders wrapped navigator and merges options object and options callback prop', () => {
  const Root = createTestNavigator({
    initialRouteName: 'Feed',
    screenOptions: {
      className: 'config-class',
      testId: 'config-test-id',
    },
    screens: {
      Feed: TestScreen,
      Profile: TestScreen,
      Settings: TestScreen,
    },
  }).with(({ Navigator }) => {
    return (
      <section data-testid="root-wrapper">
        <Navigator
          initialRouteName="Profile"
          screenOptions={({ route }) => ({
            testId: `navigator-${route.name}`,
          })}
        />
      </section>
    );
  });

  expect(Root).not.toHaveProperty('with');

  const RootComponent = Root.getComponent();

  const element = render(
    <BaseNavigationContainer>
      <RootComponent />
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`
    <section
      data-testid="root-wrapper"
    >
      <main>
        <div
          className="config-class"
          data-testid="navigator-Feed"
        >
          Screen:
          Feed
        </div>
        <div
          className="config-class"
          data-testid="navigator-Profile"
        >
          Screen:
          Profile
          (focused)
        </div>
        <div
          className="config-class"
          data-testid="navigator-Settings"
        >
          Screen:
          Settings
        </div>
      </main>
    </section>
  `);
});

test('renders wrapped navigator and merges options callback and options object prop', () => {
  const Root = createTestNavigator({
    initialRouteName: 'Feed',
    screenOptions: ({ route }) => {
      return {
        className: `${route.name}-config-class`,
        testId: `config-${route.name}`,
      };
    },
    screens: {
      Feed: TestScreen,
      Profile: TestScreen,
      Settings: TestScreen,
    },
  }).with(({ Navigator }) => {
    return (
      <section data-testid="root-wrapper">
        <Navigator
          initialRouteName="Profile"
          screenOptions={{ testId: 'navigator-test-id' }}
        />
      </section>
    );
  });

  expect(Root).not.toHaveProperty('with');

  const RootComponent = Root.getComponent();

  const element = render(
    <BaseNavigationContainer>
      <RootComponent />
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`
    <section
      data-testid="root-wrapper"
    >
      <main>
        <div
          className="Feed-config-class"
          data-testid="navigator-test-id"
        >
          Screen:
          Feed
        </div>
        <div
          className="Profile-config-class"
          data-testid="navigator-test-id"
        >
          Screen:
          Profile
          (focused)
        </div>
        <div
          className="Settings-config-class"
          data-testid="navigator-test-id"
        >
          Screen:
          Settings
        </div>
      </main>
    </section>
  `);
});

test('renders wrapped navigator and merges options callbacks', () => {
  const Root = createTestNavigator({
    initialRouteName: 'Feed',
    screenOptions: ({ route }) => ({
      className: `${route.name}-config-class`,
      testId: `config-${route.name}`,
    }),
    screens: {
      Feed: TestScreen,
      Profile: TestScreen,
      Settings: TestScreen,
    },
  }).with(({ Navigator }) => {
    return (
      <section data-testid="root-wrapper">
        <Navigator
          initialRouteName="Profile"
          screenOptions={({ route }) => ({
            testId: `navigator-${route.name}`,
          })}
        />
      </section>
    );
  });

  expect(Root).not.toHaveProperty('with');

  const RootComponent = Root.getComponent();

  const element = render(
    <BaseNavigationContainer>
      <RootComponent />
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`
    <section
      data-testid="root-wrapper"
    >
      <main>
        <div
          className="Feed-config-class"
          data-testid="navigator-Feed"
        >
          Screen:
          Feed
        </div>
        <div
          className="Profile-config-class"
          data-testid="navigator-Profile"
        >
          Screen:
          Profile
          (focused)
        </div>
        <div
          className="Settings-config-class"
          data-testid="navigator-Settings"
        >
          Screen:
          Settings
        </div>
      </main>
    </section>
  `);
});

test('creates linking configuration for static config', () => {
  const Nested = createTestNavigator({
    screens: {
      Profile: {
        screen: TestScreen,
        linking: {
          path: 'profile/:id',
          parse: {
            id: Number,
          },
        },
      },
      Settings: {
        screen: TestScreen,
        options: {
          testId: 'settings',
        },
        linking: {
          path: 'settings',
          exact: true,
        },
      },
    },
    groups: {
      Auth: {
        screens: {
          Login: {
            screen: TestScreen,
            linking: 'login',
          },
          Register: {
            screen: TestScreen,
            linking: 'register',
          },
          Forgot: {
            screen: TestScreen,
            linking: {
              path: 'forgot-password',
              exact: true,
            },
          },
        },
      },
    },
  });

  const Root = createTestNavigator({
    screens: {
      Home: TestScreen,
      Feed: {
        screen: TestScreen,
        linking: 'feed',
      },
      Nested: {
        screen: Nested,
        linking: 'nested',
      },
    },
    groups: {
      Support: {
        screens: {
          Contact: {
            screen: TestScreen,
            linking: 'contact',
          },
          FAQ: {
            screen: TestScreen,
            linking: 'faq',
          },
        },
      },
    },
  });

  const screens = createPathConfigForStaticNavigation(Root, {});

  expect(screens).toMatchInlineSnapshot(`
{
  "Contact": {
    "path": "contact",
  },
  "FAQ": {
    "path": "faq",
  },
  "Feed": {
    "path": "feed",
  },
  "Nested": {
    "path": "nested",
    "screens": {
      "Forgot": {
        "exact": true,
        "path": "forgot-password",
      },
      "Login": {
        "path": "login",
      },
      "Profile": {
        "parse": {
          "id": [Function],
        },
        "path": "profile/:id",
      },
      "Register": {
        "path": "register",
      },
      "Settings": {
        "exact": true,
        "path": "settings",
      },
    },
  },
}
`);

  assert.ok(screens);

  expect(getStateFromPath('contact', { screens })).toEqual({
    routes: [
      {
        name: 'Contact',
        path: 'contact',
      },
    ],
  });

  expect(getStateFromPath('settings', { screens })).toEqual({
    routes: [
      {
        name: 'Nested',
        state: {
          routes: [{ name: 'Settings', path: 'settings' }],
        },
      },
    ],
  });

  expect(getStateFromPath('nested/profile/123', { screens })).toEqual({
    routes: [
      {
        name: 'Nested',
        state: {
          routes: [
            {
              name: 'Profile',
              path: 'nested/profile/123',
              params: { id: 123 },
            },
          ],
        },
      },
    ],
  });
});

test('returns undefined if there is no linking configuration', () => {
  const Nested = createTestNavigator({
    screens: {
      Profile: {
        screen: TestScreen,
      },
      Settings: {
        screen: TestScreen,
        options: {
          testId: 'settings',
        },
        linking: undefined,
      },
    },
    groups: {
      Auth: {
        screens: {
          Login: {
            screen: TestScreen,
          },
          Register: {
            screen: TestScreen,
          },
          Forgot: {
            screen: TestScreen,
          },
        },
      },
    },
  });

  const Root = createTestNavigator({
    screens: {
      Home: TestScreen,
      Feed: {
        screen: TestScreen,
      },
      Nested: {
        screen: Nested,
      },
    },
    groups: {
      Support: {
        screens: {
          Contact: {
            screen: TestScreen,
          },
          FAQ: {
            screen: TestScreen,
          },
        },
      },
    },
  });

  const screens = createPathConfigForStaticNavigation(Root, {});

  expect(screens).toBeUndefined();
});

test('automatically generates paths if auto is specified', () => {
  const NestedA = createTestNavigator({
    screens: {
      Home: TestScreen,
      Profile: {
        screen: TestScreen,
      },
      Settings: {
        screen: TestScreen,
        options: {
          testId: 'settings',
        },
      },
    },
    groups: {
      Auth: {
        screens: {
          Login: {
            screen: TestScreen,
            linking: undefined,
          },
          Register: {
            screen: TestScreen,
          },
          Forgot: {
            screen: TestScreen,
            linking: 'forgot-password',
          },
        },
      },
    },
  });

  const NestedB = createTestNavigator({
    screens: {
      Library: TestScreen,
      Wishlist: {
        screen: TestScreen,
      },
    },
  });

  const NestedC = createTestNavigator({
    screens: {
      Categories: TestScreen,
      Misc: TestScreen,
    },
  });

  const Root = createTestNavigator({
    screens: {
      NestedA,
      NestedB: {
        screen: NestedB,
        linking: 'store/:type',
      },
      NestedC,
      Feed: {
        screen: TestScreen,
      },
    },
    groups: {
      Support: {
        screens: {
          Contact: {
            screen: TestScreen,
          },
          FAQ: {
            screen: TestScreen,
          },
        },
      },
    },
  });

  const screens = createPathConfigForStaticNavigation(Root, {}, true);

  assert.ok(screens);

  expect(screens).toMatchInlineSnapshot(`
{
  "Contact": {
    "path": "contact",
  },
  "FAQ": {
    "path": "faq",
  },
  "Feed": {
    "path": "feed",
  },
  "NestedA": {
    "screens": {
      "Forgot": {
        "path": "forgot-password",
      },
      "Home": {
        "path": "",
      },
      "Profile": {
        "path": "profile",
      },
      "Register": {
        "path": "register",
      },
      "Settings": {
        "path": "settings",
      },
    },
  },
  "NestedB": {
    "path": "store/:type",
    "screens": {
      "Library": {
        "path": "library",
      },
      "Wishlist": {
        "path": "wishlist",
      },
    },
  },
  "NestedC": {
    "screens": {
      "Categories": {
        "path": "categories",
      },
      "Misc": {
        "path": "misc",
      },
    },
  },
}
`);

  expect(getStateFromPath('/', { screens })).toEqual({
    routes: [
      { name: 'NestedA', state: { routes: [{ name: 'Home', path: '' }] } },
    ],
  });

  expect(getStateFromPath('login', { screens })).toBeUndefined();

  expect(getStateFromPath('forgot-password', { screens })).toEqual({
    routes: [
      {
        name: 'NestedA',
        state: { routes: [{ name: 'Forgot', path: 'forgot-password' }] },
      },
    ],
  });

  expect(getStateFromPath('settings', { screens })).toEqual({
    routes: [
      {
        name: 'NestedA',
        state: {
          routes: [{ name: 'Settings', path: 'settings' }],
        },
      },
    ],
  });

  expect(getStateFromPath('profile?id=123', { screens })).toEqual({
    routes: [
      {
        name: 'NestedA',
        state: {
          routes: [
            {
              name: 'Profile',
              path: 'profile?id=123',
              params: { id: '123' },
            },
          ],
        },
      },
    ],
  });

  expect(getStateFromPath('store/furniture', { screens })).toEqual({
    routes: [
      {
        name: 'NestedB',
        params: { type: 'furniture' },
        path: 'store/furniture',
      },
    ],
  });

  expect(getStateFromPath('store/digital/library', { screens })).toEqual({
    routes: [
      {
        name: 'NestedB',
        params: { type: 'digital' },
        state: { routes: [{ name: 'Library', path: 'store/digital/library' }] },
      },
    ],
  });

  expect(getStateFromPath('contact', { screens })).toEqual({
    routes: [
      {
        name: 'Contact',
        path: 'contact',
      },
    ],
  });
});

test('use initialRouteName for the automatic home screen', () => {
  const NestedA = createTestNavigator({
    initialRouteName: 'Profile',
    screens: {
      Home: TestScreen,
      Profile: {
        screen: TestScreen,
      },
      Settings: {
        screen: TestScreen,
        options: {
          testId: 'settings',
        },
      },
    },
    groups: {
      Auth: {
        screens: {
          Login: {
            screen: TestScreen,
            linking: undefined,
          },
          Register: {
            screen: TestScreen,
          },
          Forgot: {
            screen: TestScreen,
            linking: 'forgot-password',
          },
        },
      },
    },
  });

  const NestedB = createTestNavigator({
    initialRouteName: 'Wishlist',
    screens: {
      Library: TestScreen,
      Wishlist: {
        screen: TestScreen,
      },
    },
  });

  const NestedC = createTestNavigator({
    initialRouteName: 'Misc',
    screens: {
      Categories: TestScreen,
      Misc: TestScreen,
    },
  });

  const Root = createTestNavigator({
    screens: {
      NestedA,
      NestedB: {
        screen: NestedB,
        linking: 'store/:type',
      },
      NestedC,
      Feed: {
        screen: TestScreen,
      },
    },
    groups: {
      Support: {
        screens: {
          Contact: {
            screen: TestScreen,
          },
          FAQ: {
            screen: TestScreen,
          },
        },
      },
    },
  });

  const screens = createPathConfigForStaticNavigation(Root, {}, true);

  assert.ok(screens);

  expect(screens).toMatchInlineSnapshot(`
{
  "Contact": {
    "path": "contact",
  },
  "FAQ": {
    "path": "faq",
  },
  "Feed": {
    "path": "feed",
  },
  "NestedA": {
    "screens": {
      "Forgot": {
        "path": "forgot-password",
      },
      "Home": {
        "path": "home",
      },
      "Profile": {
        "path": "",
      },
      "Register": {
        "path": "register",
      },
      "Settings": {
        "path": "settings",
      },
    },
  },
  "NestedB": {
    "path": "store/:type",
    "screens": {
      "Library": {
        "path": "library",
      },
      "Wishlist": {
        "path": "wishlist",
      },
    },
  },
  "NestedC": {
    "screens": {
      "Categories": {
        "path": "categories",
      },
      "Misc": {
        "path": "misc",
      },
    },
  },
}
`);

  expect(getStateFromPath('/', { screens })).toEqual({
    routes: [
      { name: 'NestedA', state: { routes: [{ name: 'Profile', path: '' }] } },
    ],
  });

  expect(getStateFromPath('login', { screens })).toBeUndefined();

  expect(getStateFromPath('forgot-password', { screens })).toEqual({
    routes: [
      {
        name: 'NestedA',
        state: { routes: [{ name: 'Forgot', path: 'forgot-password' }] },
      },
    ],
  });

  expect(getStateFromPath('settings', { screens })).toEqual({
    routes: [
      {
        name: 'NestedA',
        state: {
          routes: [{ name: 'Settings', path: 'settings' }],
        },
      },
    ],
  });

  expect(getStateFromPath('store/furniture', { screens })).toEqual({
    routes: [
      {
        name: 'NestedB',
        params: { type: 'furniture' },
        path: 'store/furniture',
      },
    ],
  });

  expect(getStateFromPath('store/digital/library', { screens })).toEqual({
    routes: [
      {
        name: 'NestedB',
        params: { type: 'digital' },
        state: { routes: [{ name: 'Library', path: 'store/digital/library' }] },
      },
    ],
  });

  expect(getStateFromPath('contact', { screens })).toEqual({
    routes: [
      {
        name: 'Contact',
        path: 'contact',
      },
    ],
  });
});

test('handles config with only groups', () => {
  const Root = createTestNavigator({
    groups: {
      Support: {
        screens: {
          Contact: {
            screen: TestScreen,
          },
          FAQ: {
            screen: TestScreen,
          },
        },
      },
      Legal: {
        screens: {
          Terms: {
            screen: TestScreen,
          },
          Privacy: {
            screen: TestScreen,
          },
        },
      },
    },
  });

  const screens = createPathConfigForStaticNavigation(Root, {}, true);

  expect(screens).toMatchInlineSnapshot(`
{
  "Contact": {
    "path": "",
  },
  "FAQ": {
    "path": "faq",
  },
  "Privacy": {
    "path": "privacy",
  },
  "Terms": {
    "path": "terms",
  },
}
`);
});

test("doesn't generate empty path if initialRouteName already has a path", () => {
  const Nested = createTestNavigator({
    initialRouteName: 'Second',
    screens: {
      First: {
        screen: TestScreen,
      },
      Second: {
        screen: TestScreen,
        linking: {
          path: 'second',
        },
      },
      Third: {
        screen: TestScreen,
      },
    },
  });

  expect(createPathConfigForStaticNavigation(Nested, {}, true))
    .toMatchInlineSnapshot(`
{
  "First": {
    "path": "first",
  },
  "Second": {
    "path": "second",
  },
  "Third": {
    "path": "third",
  },
}
`);

  const Root = createTestNavigator({
    screens: {
      Nested: {
        screen: Nested,
      },
      Other: {
        screen: TestScreen,
      },
    },
  });

  expect(createPathConfigForStaticNavigation(Root, {}, true))
    .toMatchInlineSnapshot(`
{
  "Nested": {
    "screens": {
      "First": {
        "path": "first",
      },
      "Second": {
        "path": "second",
      },
      "Third": {
        "path": "third",
      },
    },
  },
  "Other": {
    "path": "other",
  },
}
`);
});

test("doesn't generate empty path if it's already present", () => {
  const Nested = createTestNavigator({
    initialRouteName: 'Updates',
    screens: {
      Home: {
        screen: TestScreen,
        options: {
          title: 'Feed',
        },
        linking: {
          path: '',
        },
      },
      Updates: {
        screen: TestScreen,
      },
    },
  });

  const Root = createTestNavigator({
    groups: {
      Guest: {
        screens: {
          SignIn: {
            screen: TestScreen,
            options: {
              title: 'Welcome!',
            },
            linking: {
              path: 'sign-in',
            },
          },
        },
      },
      User: {
        screens: {
          Profile: {
            screen: TestScreen,
          },
          HomeTabs: {
            screen: Nested,
          },
        },
      },
    },
  });

  const screens = createPathConfigForStaticNavigation(Root, {}, true);

  expect(screens).toMatchInlineSnapshot(`
{
  "HomeTabs": {
    "screens": {
      "Home": {
        "path": "",
      },
      "Updates": {
        "path": "updates",
      },
    },
  },
  "Profile": {
    "path": "profile",
  },
  "SignIn": {
    "path": "sign-in",
  },
}
`);
});

test("doesn't skip initial screen detection if parent has empty path", () => {
  const Nested = createTestNavigator({
    screens: {
      Home: {
        screen: TestScreen,
        options: {
          title: 'Feed',
        },
      },
      Updates: {
        screen: TestScreen,
      },
    },
  });

  const Root = createTestNavigator({
    groups: {
      Guest: {
        screens: {
          SignIn: {
            screen: TestScreen,
            options: {
              title: 'Welcome!',
            },
            linking: {
              path: 'sign-in',
            },
          },
        },
      },
      User: {
        screens: {
          HomeTabs: {
            screen: Nested,
            linking: {
              path: '/',
            },
          },
          Profile: {
            screen: TestScreen,
          },
        },
      },
    },
  });

  const screens = createPathConfigForStaticNavigation(Root, {}, true);

  expect(screens).toMatchInlineSnapshot(`
{
  "HomeTabs": {
    "path": "",
    "screens": {
      "Home": {
        "path": "",
      },
      "Updates": {
        "path": "updates",
      },
    },
  },
  "Profile": {
    "path": "profile",
  },
  "SignIn": {
    "path": "sign-in",
  },
}
`);
});

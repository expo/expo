---
title: Testing configuration for Expo Router
sidebar_title: Testing
description: Learn how to create integration tests for your app when using Expo Router.
---

import { APIBox } from '~/components/plugins/APIBox';

Expo Router relies on your file system, which can present challenges when setting up mocks for integration tests. Expo Router's submodule, `expo-router/testing-library`, is a set of testing utilities built on top of the popular [`@testing-library/react-native`](https://callstack.github.io/react-native-testing-library/) and allows you to quickly create in-memory Expo Router apps that are pre-configured for testing.

## Configuration

Before you proceed, ensure you have set up `jest-expo` according to the [Unit testing with Jest](/develop/unit-testing/) and [`@testing-library/react-native`](https://callstack.github.io/react-native-testing-library/docs/start/quick-start) in your project.

> **Note**: When using Expo Router, do not put your test files inside the **app** directory. All files inside your **app** folder must be either routes or layout files. Instead, use the **\_\_tests\_\_** directory or a separate directory. This approach is explained in [Unit testing with Jest](/develop/unit-testing/#structure-your-tests).

### Jest Native Matchers (optional)

[`@testing-library/jest-native`](https://testing-library.com/docs/ecosystem-jest-native/) provides custom Jest matchers that can be used to extend the functionality of `@testing-library/react-native`. If installed, Expo Router will automatically perform the `@testing-library/jest-native` setup.

## `renderRouter`

`renderRouter` extends the functionality of [`render`](https://callstack.github.io/react-native-testing-library/docs/api#render) to simplify testing with Expo Router. It returns the same query object as [`render`](https://callstack.github.io/react-native-testing-library/docs/api#render), and is compatible with [`screen`](https://callstack.github.io/react-native-testing-library/docs/api#screen), allowing you to use the standard [query API](https://callstack.github.io/react-native-testing-library/docs/api/queries) to locate components.

`renderRouter` accepts the same [options](https://callstack.github.io/react-native-testing-library/docs/api#render-options) as `render` and introduces an additional option `initialUrl`, which sets an initial route for simulating deep-linking.

<APIBox header="Inline file system">

`renderRouter(mock: Record<string, ReactComponent>, options: RenderOptions)`

`renderRouter` can provide inline-mocking of a file system by passing an object to this function as the first parameter. The keys of the object are the mock filesystem paths. **Do not use leading relative (`./`) or absolute (`/`) notation when defining these paths and exclude file extension.**

```tsx app.test.tsx
import { renderRouter, screen } from 'expo-router/testing-library';

it('my-test', async () => {
  const MockComponent = jest.fn(() => <View />);

  renderRouter(
    {
      index: MockComponent,
      'directory/a': MockComponent,
      '(group)/b': MockComponent,
    },
    {
      initialUrl: '/directory/a',
    }
  );

  expect(screen).toHavePathname('/directory/a');
});
```

</APIBox>

<APIBox header="Inline file system with `null` components">

`renderRouter(mock: string[], options: RenderOptions)`

Providing an array of strings to `renderRouter` will create an inline mock filesystem with `null` components (`{ default: () => null }`). This is useful for testing scenarios where you do not need to test the output of a route.

```tsx app.test.tsx
import { renderRouter, screen } from 'expo-router/testing-library';

it('my-test', async () => {
  renderRouter(['index', 'directory/a', '(group)/b'], {
    initialUrl: '/directory/a',
  });

  expect(screen).toHavePathname('/directory/a');
});
```

</APIBox>

<APIBox header="Path to fixture">

`renderRouter(fixturePath: string, options: RenderOptions)`

`renderRouter` can accept a directory path to mock an existing fixture. Ensure that the provided path is relative to the current test file.

```tsx app.test.js
it('my-test', async () => {
  const MockComponent = jest.fn(() => <View />);
  renderRouter('./my-test-fixture');
});
```

</APIBox>

<APIBox header="Path to the fixture with overrides">

`renderRouter({ appDir: string, overrides: Record<string, ReactComponent>}, options: RenderOptions)`

For more intricate testing scenarios, `renderRouter` can leverage both directory path and inline-mocking methods simultaneously. The `appDir` parameter takes a string representing a pathname to a directory. The overrides parameter is an inline mock that can be used to override specific paths within the `appDir`. This combination allows for fine-tuned control over the mock environment.

```tsx app.test.js
it('my-test', async () => {
  const MockAuthLayout = jest.fn(() => <View />);
  renderRouter({
    appDir: './my-test-fixture',
    overrides: {
      'directory/(auth)/_layout': MockAuthLayout,
    },
  });
});
```

</APIBox>

## Jest matchers

The following matches have been added to `expect` and can be used to assert values on `screen`.

<APIBox header="toHavePathname()">

Assert the current pathname against a given string. The matcher uses the value of the [`usePathname`](/router/reference/hooks/#usepathname) hook on the current `screen`.

```tsx app.test.ts
expect(screen).toHavePathname('/my-router');
```

</APIBox>

<APIBox header="toHavePathnameWithParams()">

Assert the current pathname, including URL parameters, against a given string. This is useful to assert the appearance of URL in a web browser.

```tsx app.test.ts
expect(screen).toHavePathnameWithParams('/my-router?hello=world');
```

</APIBox>

<APIBox header="toHaveSegments()">

Assert the current segments against an array of strings. The matcher uses the value of the [`useSegments`](/router/reference/hooks/#usesegments) hook on the current `screen`.

```tsx app.test.ts
expect(screen).toHaveSegments(['[id]']);
```

</APIBox>
<APIBox header="useLocalSearchParams()">

Assert the current local URL parameters against an object. The matcher uses the value of the [`useLocalSearchParams`](/router/reference/hooks/#uselocalsearchparams) hook on the current `screen`.

```tsx app.test.ts
expect(screen).useLocalSearchParams({ first: 'abc' });
```

</APIBox>
<APIBox header="useGlobalSearchParams()">

Assert the current screen's pathname that matches a value. Compares using the value of [`useGlobalSearchParams`](/router/reference/hooks/#useglobalsearchparams) hook.

Assert the current global URL parameters against an object. The matcher uses the value of the [`useGlobalSearchParams`](/router/reference/hooks/#useglobalsearchparams) hook on the current `screen`.

```tsx app.test.ts
expect(screen).useGlobalSearchParams({ first: 'abc' });
```

</APIBox>

<APIBox header="toHaveRouterState()">

An advanced matcher that asserts the current router state against an object.

```tsx app.test.ts
expect(screen).toHaveRouterState({
  routes: [{ name: 'index', path: '/' }],
});
```

</APIBox>

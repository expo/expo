import { act, render, waitFor } from '@testing-library/react-native';

import { RouterRegistryProvider } from '../../global-state/routerRegistry';
import { store } from '../../global-state/store';
import { Screen } from '../../react-navigation/core/Screen';
import { createNavigationContainerRef } from '../../react-navigation/core/createNavigationContainerRef';
import { useNavigationBuilder } from '../../react-navigation/core/useNavigationBuilder';
import { CommonActions, StackRouter } from '../../react-navigation/routers';
import { NavigationContainer } from '../NavigationContainer';
import { createMemoryHistory } from '../createMemoryHistory';

jest.mock('../createMemoryHistory');

let mockNavigationRef: ReturnType<typeof createNavigationContainerRef>;

const history = {
  index: 0,
  get: jest.fn(),
  backIndex: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  listen: jest.fn(() => () => {}),
};
const locationDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'location');

function EmptyScreen() {
  return null;
}

beforeEach(() => {
  jest.mocked(createMemoryHistory).mockReturnValue(history);
  jest
    .spyOn(store, 'state', 'get')
    .mockImplementation(() => mockNavigationRef.current?.getRootState());
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { hash: '' },
  });
});

afterEach(() => {
  if (locationDescriptor) {
    Object.defineProperty(globalThis, 'location', locationDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'location');
  }
  jest.restoreAllMocks();
});

test('does not add browser history when preloading a stack route', async () => {
  const Stack = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const ref = createNavigationContainerRef<any>();
  mockNavigationRef = ref;
  const onStateChange = jest.fn();

  render(
    <RouterRegistryProvider>
      <NavigationContainer
        ref={ref}
        documentTitle={{ enabled: false }}
        onStateChange={onStateChange}
        linking={{
          prefixes: [],
          config: { screens: { home: 'home', details: 'details' } },
        }}>
        <Stack>
          <Screen name="home" component={EmptyScreen} />
          <Screen name="details" component={EmptyScreen} />
        </Stack>
      </NavigationContainer>
    </RouterRegistryProvider>
  );

  await waitFor(() => expect(ref.current).not.toBeNull());
  history.push.mockClear();
  history.replace.mockClear();

  act(() => ref.current?.dispatch(CommonActions.preload('details')));

  await waitFor(() => expect(history.replace).toHaveBeenCalled());
  expect(onStateChange).toHaveBeenCalled();
  expect(history.push).not.toHaveBeenCalled();
});

import { act, render, waitFor } from '@testing-library/react-native';

import { Screen } from '../../core/Screen';
import { createNavigationContainerRef } from '../../core/createNavigationContainerRef';
import { useNavigationBuilder } from '../../core/useNavigationBuilder';
import { CommonActions, StackRouter } from '../../routers';
import { NavigationContainer } from '../NavigationContainer';
import { createMemoryHistory } from '../createMemoryHistory';

jest.mock('../createMemoryHistory');

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
  const onStateChange = jest.fn();

  render(
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
  );

  await waitFor(() => expect(ref.current).not.toBeNull());
  history.push.mockClear();
  history.replace.mockClear();

  act(() => ref.current?.dispatch(CommonActions.preload('details')));

  await waitFor(() => expect(history.replace).toHaveBeenCalled());
  expect(onStateChange).toHaveBeenCalled();
  expect(history.push).not.toHaveBeenCalled();
});

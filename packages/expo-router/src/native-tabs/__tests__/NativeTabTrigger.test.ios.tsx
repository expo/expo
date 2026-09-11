import { render } from '@testing-library/react-native';

import { NavigatorTypeContext } from '../../react-navigation/core';
import { NativeTabTrigger } from '../NativeTabTrigger';

const mockNavigation = {
  getState: jest.fn(() => ({ routes: [] })),
  setOptions: jest.fn(),
};

jest.mock('../../react-navigation/native', () => {
  const actualModule = jest.requireActual(
    '../../react-navigation/native'
  ) as typeof import('../../react-navigation/native');
  return {
    ...actualModule,
    useNavigation: () => mockNavigation,
    useRoute: () => ({ name: 'index' }),
  };
});

jest.mock('../../useFocusEffect', () => ({
  useFocusEffect: (effect: () => void) => effect(),
}));

test('uses the router type from context', () => {
  render(
    <NavigatorTypeContext.Provider value="tab">
      <NativeTabTrigger unstable_nativeProps={{ title: 'Home' }} />
    </NavigatorTypeContext.Provider>
  );

  expect(mockNavigation.getState).not.toHaveBeenCalled();
  expect(mockNavigation.setOptions).toHaveBeenCalledWith({ nativeProps: { title: 'Home' } });
});

test('rejects a trigger rendered in a nested stack screen', () => {
  expect(() =>
    render(
      <NavigatorTypeContext.Provider value="stack">
        <NativeTabTrigger />
      </NavigatorTypeContext.Provider>
    )
  ).toThrow('Trigger component can only be used in the tab screen. Current route: index');
});

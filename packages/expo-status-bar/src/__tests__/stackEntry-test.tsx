import { StatusBar as NativeStatusBar } from 'react-native';

import ExpoStatusBar from '../ExpoStatusBar';
import { StatusBar } from '../NativeStatusBarWrapper';

jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => ({
  __esModule: true,
  default: {
    pushStackEntry: jest.fn((props) => ({ props })),
    replaceStackEntry: jest.fn((_entry, props) => ({ props })),
    popStackEntry: jest.fn(),
  },
}));

jest.mock('../ExpoStatusBar', () => ({
  __esModule: true,
  default: { setVerticalBarBehavior: jest.fn() },
}));

afterEach(() => {
  jest.clearAllMocks();
});

test('pushes the props onto the React Native stack with the names it uses', () => {
  StatusBar.pushStackEntry({
    style: 'light',
    hidden: true,
    animated: true,
    hideTransitionAnimation: 'slide',
  });
  expect(NativeStatusBar.pushStackEntry).toHaveBeenCalledWith({
    barStyle: 'light-content',
    hidden: true,
    animated: true,
    showHideTransition: 'slide',
  });
});

test('leaves unset props to the entries below', () => {
  StatusBar.pushStackEntry({ hidden: true });
  expect(NativeStatusBar.pushStackEntry).toHaveBeenCalledWith(
    expect.objectContaining({ barStyle: undefined, hidden: true })
  );
});

test('replaces and pops the React Native entry', () => {
  const entry = StatusBar.pushStackEntry({ style: 'light' });
  const replaced = StatusBar.replaceStackEntry(entry, { style: 'dark' });
  expect(NativeStatusBar.replaceStackEntry).toHaveBeenCalledWith(
    { props: expect.objectContaining({ barStyle: 'light-content' }) },
    expect.objectContaining({ barStyle: 'dark-content' })
  );

  StatusBar.popStackEntry(replaced);
  expect(NativeStatusBar.popStackEntry).toHaveBeenCalledWith({
    props: expect.objectContaining({ barStyle: 'dark-content' }),
  });
});

test('applies verticalBarBehaviorIOS until the entry is popped', () => {
  const setVerticalBarBehavior = jest.mocked(ExpoStatusBar!.setVerticalBarBehavior);
  const entry = StatusBar.pushStackEntry({ verticalBarBehaviorIOS: 'disabled' });
  expect(setVerticalBarBehavior).toHaveBeenLastCalledWith('disabled');

  StatusBar.popStackEntry(entry);
  expect(setVerticalBarBehavior).toHaveBeenLastCalledWith('automatic');
});

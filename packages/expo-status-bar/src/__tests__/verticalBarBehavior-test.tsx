import { render } from '@testing-library/react-native';

import ExpoStatusBar from '../ExpoStatusBar';
import { StatusBar } from '../NativeStatusBarWrapper';
import { mockNativeStatusBar } from './Helpers';

mockNativeStatusBar();

jest.mock('../ExpoStatusBar', () => ({
  __esModule: true,
  default: { setVerticalBarBehavior: jest.fn() },
}));

test('restores the behavior of a still-mounted StatusBar when a later one unmounts', async () => {
  const setVerticalBarBehavior = jest.mocked(ExpoStatusBar!.setVerticalBarBehavior);
  const screenA = await render(<StatusBar verticalBarBehaviorIOS="disabled" />);
  const screenB = await render(<StatusBar verticalBarBehaviorIOS="automatic" />);
  expect(setVerticalBarBehavior.mock.calls).toEqual([['disabled'], ['automatic']]);

  await screenB.unmount();
  expect(setVerticalBarBehavior).toHaveBeenLastCalledWith('disabled');

  await screenA.unmount();
  expect(setVerticalBarBehavior).toHaveBeenLastCalledWith('automatic');
});

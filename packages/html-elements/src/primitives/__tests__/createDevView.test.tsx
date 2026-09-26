import { render } from '@testing-library/react-native';
import { Platform, View as NativeView } from 'react-native';

import { createDevView } from '../createDevView';

export const View = createDevView(NativeView);

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

it('renders', async () => {
  // Ensure no errors
  await expect(
    render(
      <View>
        <View />
      </View>
    )
  ).resolves.not.toThrow();
});

it('asserts react-dom elements', async () => {
  const instance = (
    <View>
      <div />
    </View>
  );

  if (Platform.OS === 'web') {
    // Ensure no errors
    await expect(render(instance)).resolves.not.toThrow();
  } else {
    await expect(async () => await render(instance)).rejects.toThrow(
      /Using unsupported React DOM element/
    );
  }
});

it('warns about unwrapped strings', async () => {
  if (Platform.OS === 'web') {
    // The test renderer only treats React Native's `Text` as a text host, so on web the warning's
    // own `<Text>` (a `<div>`) is rejected before it can be snapshotted. The warning still fires.
    // React retries the render once after the thrown error, so the warning fires more than once.
    await expect(render(<View>Hey</View>)).rejects.toThrow(/must be rendered within/);
    expect(console.warn).toHaveBeenCalled();
  } else {
    // Ensure no errors
    const { toJSON } = await render(<View>Hey</View>);
    expect(toJSON()).toMatchSnapshot();
    expect(console.warn).toHaveBeenCalledTimes(1);
  }
});

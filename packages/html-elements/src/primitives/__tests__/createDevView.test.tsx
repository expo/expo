import { render as renderDOM } from '@testing-library/react';
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
  ).resolves.toBeDefined();
});

it('asserts react-dom elements', async () => {
  const instance = (
    <View>
      <div />
    </View>
  );

  if (Platform.OS === 'web') {
    // Ensure no errors
    await expect(render(instance)).resolves.toBeDefined();
  } else {
    await expect(async () => await render(instance)).rejects.toThrow(
      /Using unsupported React DOM element/
    );
  }
});

it('warns about unwrapped strings', async () => {
  if (Platform.OS === 'web') {
    // RNTL only accepts text inside React Native's `Text` host, but react-native-web renders `Text` as a `div`.
    const { container } = renderDOM(<View>Hey</View>);
    expect(container).toMatchSnapshot();
  } else {
    // Ensure no errors
    const { toJSON } = await render(<View>Hey</View>);
    expect(toJSON()).toMatchSnapshot();
  }

  expect(console.warn).toHaveBeenCalledTimes(1);
});

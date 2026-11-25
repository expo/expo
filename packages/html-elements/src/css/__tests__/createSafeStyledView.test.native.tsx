import { render } from '@testing-library/react-native';

import View from '../../primitives/View';
import { createSafeStyledView } from '../createSafeStyledView';

const Safe = createSafeStyledView(View);

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

it('strips invalid style properties', async () => {
  const { toJSON } = await render(
    <Safe
      style={{
        transitionDuration: '200ms',
        position: 'absolute',
      }}
    />
  );
  expect(toJSON()).toMatchSnapshot();
});

it('preserves backgroundImage, which React Native supports natively', async () => {
  const { toJSON } = await render(
    <Safe
      style={{
        backgroundImage: 'linear-gradient(to bottom, red, blue)',
        backgroundClip: 'border-box',
      }}
    />
  );
  const json = toJSON();
  expect(json && !Array.isArray(json) && json.props.style).toMatchObject({
    backgroundImage: 'linear-gradient(to bottom, red, blue)',
  });
});

it('replaces invalid position with "relative"', async () => {
  const { toJSON } = await render(
    <Safe
      style={{
        position: 'fixed',
      }}
    />
  );
  expect(toJSON()).toMatchSnapshot();
  expect(console.warn).toHaveBeenCalledWith(`Unsupported position: 'fixed'`);
});

it('mocks out visibility: hidden by lowering the opacity', async () => {
  const { toJSON } = await render(
    <Safe
      style={{
        visibility: 'hidden',
      }}
    />
  );
  expect(toJSON()).toMatchSnapshot();
});

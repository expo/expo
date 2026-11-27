import { render } from '@testing-library/react-native';

import { Text } from '..';

const mockNativeViewFn = jest.fn();

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
  requireNativeView: jest.fn((...args) => {
    if (args[0] !== 'ExpoUI' || args[1] !== 'TextView') {
      throw new Error(`Unexpected native view requested: ${args[0]} ${args[1]}`);
    }
    const { View } = require('react-native');
    const { createElement } = require('react');
    const MockView = (props: any) => {
      mockNativeViewFn(props);
      return createElement(View, props);
    };
    return MockView;
  }),
}));

beforeEach(() => {
  mockNativeViewFn.mockClear();
});

function renderedTexts() {
  return mockNativeViewFn.mock.calls.map((call) => call[0].text).filter((text) => text != null);
}

describe('Text', () => {
  it('keeps nested Text spans inside a fragment', async () => {
    await render(
      <Text>
        A
        <>
          <Text>-B</Text>
        </>
        <Text>-C</Text>
      </Text>
    );
    expect(renderedTexts()).toEqual(['A', '-B', '-C']);
  });

  it('joins string children inside a fragment into one text', async () => {
    await render(
      <Text>
        A<>-B</>
      </Text>
    );
    expect(renderedTexts()).toEqual(['A-B']);
  });
});

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

function renderedProps() {
  expect(mockNativeViewFn).toHaveBeenCalledTimes(1);
  return mockNativeViewFn.mock.calls[0][0];
}

function spanTexts(spans: { text?: string; children?: any[] }[]): string[] {
  return spans.flatMap((span) => (span.children ? spanTexts(span.children) : [span.text ?? '']));
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
    expect(spanTexts(renderedProps().spans)).toEqual(['A', '-B', '-C']);
  });

  it('keeps nested Text spans when only a fragment holds them', async () => {
    await render(
      <Text>
        A
        <>
          <Text>-B</Text>
        </>
      </Text>
    );
    expect(spanTexts(renderedProps().spans)).toEqual(['A', '-B']);
  });

  it('keeps strings inside nested fragments next to Text spans', async () => {
    await render(
      <Text>
        <Text>A</Text>
        <>
          <>-B</>
          <Text>-C</Text>
        </>
      </Text>
    );
    expect(spanTexts(renderedProps().spans)).toEqual(['A', '-B', '-C']);
  });

  it('joins string children inside a fragment into one text', async () => {
    await render(
      <Text>
        A<>-B</>
      </Text>
    );
    expect(renderedProps().text).toBe('A-B');
  });

  it('joins strings inside a fragment within a nested Text span', async () => {
    await render(
      <Text>
        <Text>
          A<>-B</>
        </Text>
      </Text>
    );
    expect(spanTexts(renderedProps().spans)).toEqual(['A-B']);
  });
});

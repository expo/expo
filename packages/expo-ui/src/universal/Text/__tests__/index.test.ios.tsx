import { render } from '@testing-library/react-native';

import { Text } from '..';
import { font, foregroundStyle, lineLimit, opacity } from '../../../swift-ui/modifiers';

const mockNativeViewFn = jest.fn();

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
  requireNativeView: jest.fn((moduleName: string, viewName: string) => {
    const { View } = require('react-native');
    const { createElement } = require('react');
    const MockView = (props: any) => {
      mockNativeViewFn(viewName, props);
      // Swallow string children — the RN mock View can't render raw text.
      return createElement(View, { ...props, children: undefined });
    };
    return MockView;
  }),
}));

beforeEach(() => {
  mockNativeViewFn.mockClear();
});

function nativeTextModifiers() {
  const call = mockNativeViewFn.mock.calls.find(([viewName]) => viewName === 'TextView');
  return call?.[1].modifiers;
}

describe('Text', () => {
  it('maps textStyle.color to a foregroundStyle modifier', () => {
    render(<Text textStyle={{ color: 'red' }}>hi</Text>);
    expect(nativeTextModifiers()).toEqual([foregroundStyle('red')]);
  });

  it('does not inject textStyle-derived modifiers the user overrides', () => {
    render(
      <Text textStyle={{ color: 'red' }} modifiers={[foregroundStyle('blue')]}>
        hi
      </Text>
    );
    expect(nativeTextModifiers()).toEqual([foregroundStyle('blue')]);
  });

  it('prefers a user lineLimit modifier over numberOfLines', () => {
    render(
      <Text numberOfLines={2} modifiers={[lineLimit(5)]}>
        hi
      </Text>
    );
    expect(nativeTextModifiers()).toEqual([lineLimit(5)]);
  });

  it('keeps derived modifiers the user does not override', () => {
    render(
      <Text textStyle={{ color: 'red', fontSize: 20 }} modifiers={[opacity(0.5)]}>
        hi
      </Text>
    );
    expect(nativeTextModifiers()).toEqual([
      font({ size: 20 }),
      foregroundStyle('red'),
      opacity(0.5),
    ]);
  });
});

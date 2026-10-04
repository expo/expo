import { render } from '@testing-library/react-native';

import { Image } from '..';
import { font, foregroundStyle, opacity } from '../../modifiers';

const mockNativeViewFn = jest.fn();

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
  requireNativeView: jest.fn((...args) => {
    if (args[0] !== 'ExpoUI' || args[1] !== 'ImageView') {
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

function nativeModifiers() {
  return mockNativeViewFn.mock.calls[0][0].modifiers;
}

describe('Image', () => {
  it('applies the default symbol font when no size or font modifier is given', async () => {
    await render(<Image systemName="bell.fill" />);
    expect(nativeModifiers()).toEqual([{ $type: 'font', size: 24 }]);
  });

  it('routes the size prop to a font modifier', async () => {
    await render(<Image systemName="bell.fill" size={30} />);
    expect(nativeModifiers()).toEqual([{ $type: 'font', size: 30 }]);
  });

  it('routes the color prop to a foregroundStyle modifier', async () => {
    await render(<Image systemName="bell.fill" color="red" />);
    expect(nativeModifiers()).toEqual([{ $type: 'font', size: 24 }, foregroundStyle('red')]);
  });

  it('does not inject a default font when the user supplies a font modifier', async () => {
    await render(<Image systemName="bell.fill" modifiers={[font({ textStyle: 'largeTitle' })]} />);
    expect(nativeModifiers()).toEqual([{ $type: 'font', textStyle: 'largeTitle' }]);
  });

  it('prefers a user font modifier over the size prop', async () => {
    await render(
      <Image systemName="bell.fill" size={30} modifiers={[font({ textStyle: 'largeTitle' })]} />
    );
    expect(nativeModifiers()).toEqual([{ $type: 'font', textStyle: 'largeTitle' }]);
  });

  it('attaches the global event listener only when the user passes modifiers', async () => {
    await render(<Image systemName="bell.fill" size={30} color="red" />);
    await render(<Image systemName="bell.fill" modifiers={[opacity(0.5)]} />);
    expect(mockNativeViewFn.mock.calls[0][0].onGlobalEvent).toBeUndefined();
    expect(mockNativeViewFn.mock.calls[1][0].onGlobalEvent).toBeInstanceOf(Function);
  });

  it('keeps user modifiers ahead of the injected ones', async () => {
    await render(<Image systemName="bell.fill" color="red" modifiers={[opacity(0.5)]} />);
    expect(nativeModifiers()).toEqual([
      { $type: 'opacity', value: 0.5 },
      { $type: 'font', size: 24 },
      foregroundStyle('red'),
    ]);
  });
});

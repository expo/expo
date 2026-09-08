import { render } from '@testing-library/react-native';

import { RadioButton } from '..';

const mockNativeViewFn = jest.fn();

jest.mock('expo', () => ({
  requireNativeView: jest.fn((moduleName, viewName) => {
    if (moduleName !== 'ExpoUI') {
      throw new Error(`Unexpected native module requested: ${moduleName}`);
    }
    const { View } = require('react-native');
    const { createElement } = require('react');
    const MockView = (props: any) => {
      mockNativeViewFn(viewName, props);
      return createElement(View, props);
    };
    return MockView;
  }),
}));

beforeEach(() => {
  mockNativeViewFn.mockClear();
});

describe('RadioButton', () => {
  it('passes enabled and state colors to the native view', () => {
    const colors = {
      selectedColor: '#ff0000',
      unselectedColor: '#00ff00',
      disabledSelectedColor: '#0000ff',
      disabledUnselectedColor: '#777777',
    };

    render(<RadioButton selected enabled={false} colors={colors} />);

    const [viewName, props] = mockNativeViewFn.mock.calls[0];
    expect(viewName).toBe('RadioButtonView');
    expect(props).toEqual(
      expect.objectContaining({
        selected: true,
        enabled: false,
        colors,
      })
    );
  });

  it('leaves enabled and colors undefined when they are not specified', () => {
    render(<RadioButton selected={false} />);

    const [, props] = mockNativeViewFn.mock.calls[0];
    expect(props.enabled).toBeUndefined();
    expect(props.colors).toBeUndefined();
  });
});

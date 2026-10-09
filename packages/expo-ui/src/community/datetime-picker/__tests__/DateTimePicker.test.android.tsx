import { render } from '@testing-library/react-native';

import { DateTimePicker } from '..';

const mockNativeViewFn = jest.fn();

// Host reads the native Material palette; these tests only look at the picker's props.
jest.mock('../../../jetpack-compose/Host', () => ({
  Host: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo', () => ({
  requireNativeView: jest.fn((moduleName, viewName) => {
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

function getNativeProps(viewName: string) {
  return mockNativeViewFn.mock.calls.find(([name]) => name === viewName)?.[1];
}

describe('DateTimePicker (Android)', () => {
  const value = new Date(2026, 7, 14);

  it('hides the title and headline when inline, like iOS', async () => {
    await render(<DateTimePicker value={value} presentation="inline" />);

    expect(getNativeProps('DateTimePickerView')).toEqual(
      expect.objectContaining({ showTitle: false, showHeadline: false })
    );
  });

  it('keeps the dialog title and headline', async () => {
    await render(<DateTimePicker value={value} presentation="dialog" />);

    const props = getNativeProps('DatePickerDialogView');
    expect(props).toBeDefined();
    expect(props).not.toHaveProperty('showTitle');
    expect(props).not.toHaveProperty('showHeadline');
  });
});

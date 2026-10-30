import { render } from '@testing-library/react-native';

import { DateTimePicker } from '..';

const mockNativeViewFn = jest.fn();
const mockHostFn = jest.fn();

// Host reads the native Material palette; these tests only look at the props it receives.
jest.mock('../../../jetpack-compose/Host', () => ({
  Host: ({ children, ...props }: { children: React.ReactNode }) => {
    mockHostFn(props);
    return children;
  },
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
  mockHostFn.mockClear();
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

  it('has no container color when inline, like iOS', async () => {
    await render(<DateTimePicker value={value} presentation="inline" />);

    expect(getNativeProps('DateTimePickerView')).toEqual(
      expect.objectContaining({ elementColors: { containerColor: 'transparent' } })
    );
  });

  it('keeps the dialog title and headline', async () => {
    await render(<DateTimePicker value={value} presentation="dialog" />);

    const props = getNativeProps('DatePickerDialogView');
    expect(props).toBeDefined();
    expect(props).not.toHaveProperty('showTitle');
    expect(props).not.toHaveProperty('showHeadline');
  });

  it.each(['inline', 'dialog'] as const)(
    'applies themeVariant as the %s picker color scheme',
    async (presentation) => {
      await render(
        <DateTimePicker value={value} presentation={presentation} themeVariant="dark" />
      );

      expect(mockHostFn).toHaveBeenCalledWith(expect.objectContaining({ colorScheme: 'dark' }));
    }
  );
});

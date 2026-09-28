import { render } from '@testing-library/react-native';

import { DateRangePicker, DateRangePickerDialog } from '..';

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

function getNativeProps(viewName: string) {
  return mockNativeViewFn.mock.calls.find(([name]) => name === viewName)?.[1];
}

describe('DateRangePicker', () => {
  it('converts initial and selectable dates to timestamps', () => {
    const initialStartDate = '2026-08-10T00:00:00.000Z';
    const initialEndDate = '2026-08-14T00:00:00.000Z';
    const selectableStart = new Date('2026-08-01T00:00:00.000Z');
    const selectableEnd = new Date('2026-08-31T00:00:00.000Z');

    render(
      <DateRangePicker
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        selectableDates={{ start: selectableStart, end: selectableEnd }}
        variant="input"
        showVariantToggle={false}
      />
    );

    expect(getNativeProps('DateRangePickerView')).toEqual(
      expect.objectContaining({
        initialStartDate: new Date(initialStartDate).getTime(),
        initialEndDate: new Date(initialEndDate).getTime(),
        selectableDates: {
          start: selectableStart.getTime(),
          end: selectableEnd.getTime(),
        },
        variant: 'input',
        showVariantToggle: false,
      })
    );
  });

  it('unwraps complete and incomplete range events', () => {
    const onDateRangeSelected = jest.fn();
    render(<DateRangePicker onDateRangeSelected={onDateRangeSelected} />);

    const props = getNativeProps('DateRangePickerView');
    const start = Date.UTC(2026, 7, 10);
    const end = Date.UTC(2026, 7, 14);

    props.onDateRangeSelected({ nativeEvent: { start, end: null } });
    props.onDateRangeSelected({ nativeEvent: { start, end } });

    expect(onDateRangeSelected).toHaveBeenNthCalledWith(1, {
      start: new Date(start),
      end: null,
    });
    expect(onDateRangeSelected).toHaveBeenNthCalledWith(2, {
      start: new Date(start),
      end: new Date(end),
    });
  });
});

describe('DateRangePickerDialog', () => {
  it('converts props and unwraps native events', () => {
    const onDateRangeSelected = jest.fn();
    const onDismissRequest = jest.fn();
    const start = Date.UTC(2026, 7, 10);
    const end = Date.UTC(2026, 7, 14);

    render(
      <DateRangePickerDialog
        initialStartDate={new Date(start).toISOString()}
        initialEndDate={new Date(end).toISOString()}
        confirmButtonLabel="Select"
        dismissButtonLabel="Cancel"
        onDateRangeSelected={onDateRangeSelected}
        onDismissRequest={onDismissRequest}
      />
    );

    const props = getNativeProps('DateRangePickerDialogView');
    expect(props).toEqual(
      expect.objectContaining({
        initialStartDate: start,
        initialEndDate: end,
        confirmButtonLabel: 'Select',
        dismissButtonLabel: 'Cancel',
      })
    );

    props.onDateRangeSelected({ nativeEvent: { start, end } });
    props.onDismissRequest();

    expect(onDateRangeSelected).toHaveBeenCalledWith({
      start: new Date(start),
      end: new Date(end),
    });
    expect(onDismissRequest).toHaveBeenCalledTimes(1);
  });
});

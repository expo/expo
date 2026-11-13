import { DateTimePicker as CommunityDateTimePicker } from '../community/datetime-picker/DateTimePicker.android';
import { DateTimePicker } from '../jetpack-compose/DatePicker';

jest.mock('expo');

describe('DateTimePicker', () => {
  it('preserves null selections and converts timestamps, including zero, to dates', () => {
    const onDateSelected = jest.fn();
    const timestamp = Date.UTC(2026, 9, 30);

    const nativeProps = DateTimePicker({ variant: 'input', onDateSelected }).props;
    for (const date of [timestamp, null, 0]) {
      nativeProps.onDateSelected({ nativeEvent: { date } });
    }

    expect(onDateSelected.mock.calls).toEqual([[new Date(timestamp)], [null], [new Date(0)]]);
  });

  it('does not report an incomplete selection through the community date picker', () => {
    const onValueChange = jest.fn();
    const value = new Date('2026-10-30T12:00:00.000Z');

    const picker = CommunityDateTimePicker({
      value,
      presentation: 'inline',
      mode: 'date',
      onValueChange,
    }).props.children;
    picker.type(picker.props).props.onDateSelected({ nativeEvent: { date: null } });

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

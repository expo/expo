import { DateTimePicker } from '../community/datetime-picker/DateTimePicker';

export {
  type DateTimePickerEvent,
  type DateTimePickerChangeEvent,
  type DateTimePickerProps,
} from '../community/datetime-picker/types';

if (__DEV__) {
  console.warn(
    "[@expo/ui] Importing from '@expo/ui/datetime-picker' is deprecated. Import from '@expo/ui/community/datetime-picker' instead."
  );
}

export default DateTimePicker;
// named export needed for docs generator
export { DateTimePicker };

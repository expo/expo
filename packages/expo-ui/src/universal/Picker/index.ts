import { Picker as PickerBase } from './Picker';
import { PickerItem } from './PickerItem';
import type { PickerItemProps, PickerItemValue } from './types';

const Picker = PickerBase as typeof PickerBase & {
  Item: <T extends PickerItemValue>(props: PickerItemProps<T>) => null;
};
Picker.Item = PickerItem;

export { Picker };
export * from './types';

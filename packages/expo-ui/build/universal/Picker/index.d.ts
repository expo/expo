import { Picker as PickerBase } from './Picker';
import type { PickerItemProps, PickerItemValue } from './types';
declare const Picker: typeof PickerBase & {
    Item: <T extends PickerItemValue>(props: PickerItemProps<T>) => null;
};
export { Picker };
export * from './types';
//# sourceMappingURL=index.d.ts.map
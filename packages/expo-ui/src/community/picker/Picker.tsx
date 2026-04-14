import { PickerItem, type PickerWithItems } from './types';

function PickerImpl(): never {
  throw new Error('Picker is not supported on web. Use a <select> element instead.');
}

export const Picker: PickerWithItems = Object.assign(PickerImpl, { Item: PickerItem });

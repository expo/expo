import { PickerItem } from './types';

function PickerComponent() {
  throw new Error('Picker is not supported on web. Use a <select> element instead.');
}

export const Picker: typeof PickerComponent & { Item: typeof PickerItem } = Object.assign(
  PickerComponent,
  { Item: PickerItem }
);

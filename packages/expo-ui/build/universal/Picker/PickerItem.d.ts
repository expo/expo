import { type ReactNode } from 'react';
import type { ExtractedPickerItem, PickerItemProps, PickerItemValue } from './types';
/**
 * Data-only option marker for [`Picker`](#picker).
 * Used via the compound API: `<Picker.Item label="…" value={…} />`.
 */
export declare function PickerItem<T extends PickerItemValue>(_props: PickerItemProps<T>): null;
export declare function extractPickerItems<T extends PickerItemValue>(children: ReactNode): ExtractedPickerItem<T>[];
//# sourceMappingURL=PickerItem.d.ts.map
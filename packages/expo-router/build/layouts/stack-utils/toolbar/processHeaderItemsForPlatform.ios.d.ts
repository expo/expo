import { type ReactNode } from 'react';
import type { ToolbarPlacement } from './context';
import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';
/**
 * On iOS, left/right toolbar items are converted to `unstable_headerLeftItems`/`unstable_headerRightItems`
 * which react-native-screens processes natively.
 */
export declare function processHeaderItemsForPlatform(children: ReactNode, placement: ToolbarPlacement): NativeStackNavigationOptions | null;
//# sourceMappingURL=processHeaderItemsForPlatform.ios.d.ts.map
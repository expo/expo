import { type ReactNode } from 'react';
import { type ToolbarColors, type ToolbarPlacement } from './context';
import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';
/**
 * On Android, renders toolbar children as native Compose components inside `headerLeft`/`headerRight`.
 * This bridges the gap since Android's react-native-screens doesn't support
 * `unstable_headerLeftItems`/`unstable_headerRightItems`.
 */
export declare function processHeaderItemsForPlatform(children: ReactNode, placement: ToolbarPlacement, colors?: ToolbarColors): NativeStackNavigationOptions | null;
//# sourceMappingURL=processHeaderItemsForPlatform.android.d.ts.map
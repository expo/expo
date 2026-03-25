import type { ReactNode } from 'react';
import type { ToolbarPlacement } from './context';
import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';
/**
 * Default/web noop. On iOS, the `.ios.tsx` variant converts children to
 * `unstable_headerLeftItems`/`unstable_headerRightItems`. On Android, the
 * `.android.tsx` variant renders native Compose components via `headerLeft`/`headerRight`.
 */
export declare function processHeaderItemsForPlatform(_children: ReactNode, _placement: ToolbarPlacement): NativeStackNavigationOptions | null;
//# sourceMappingURL=processHeaderItemsForPlatform.d.ts.map
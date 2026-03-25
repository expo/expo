import { type NavigationState } from '../routers';
import type { NavigationProp } from './types';
/**
 * Hook to access the navigation prop of the parent screen anywhere.
 *
 * @returns Navigation prop of the parent screen.
 */
export declare function useNavigation<T = Omit<NavigationProp<ReactNavigation.RootParamList>, 'getState'> & {
    getState(): NavigationState | undefined;
}>(): T;
//# sourceMappingURL=useNavigation.d.ts.map
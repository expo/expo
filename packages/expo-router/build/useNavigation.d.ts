import { NavigationProp } from '@react-navigation/native';
/**
 * Return the navigation object for the current route.
 * @param parent Provide an absolute path like `/(root)` to the parent route or a relative path like `../../` to the parent route.
 * @returns the navigation object for the provided route.
 */
export declare function useNavigation<T = NavigationProp<ReactNavigation.RootParamList>>(parent?: string): T;
export declare function resolveParentId(contextKey: string, parentId?: string | null): string | null;
//# sourceMappingURL=useNavigation.d.ts.map
import { type ReactNode } from 'react';
import { type CommonViewModifierProps } from '../types';
export interface NavigationStackProps extends CommonViewModifierProps {
    /**
     * The root view of the stack, and the `NavigationDestination` views the stack can push. It is
     * displayed inside a navigation bar.
     */
    children: ReactNode;
    /**
     * The values of the views pushed on top of the root view, in the order they were pushed.
     * Leave it undefined to let the stack manage its own path.
     */
    path?: string[];
    /**
     * Callback function that is called when the stack pushes or pops a view, for example when a
     * `NavigationLink` is tapped or the user swipes back. Gets called with the new path.
     *
     * When `path` is set, the stack is controlled: a push takes effect once the new path comes back
     * through this prop.
     */
    onPathChange?: (path: string[]) => void;
}
/**
 * A view that displays a root view and enables you to present additional views over the root view.
 *
 * @example
 * ```tsx
 * const [path, setPath] = useState<string[]>([]);
 *
 * <NavigationStack path={path} onPathChange={setPath}>
 *   <List>
 *     <NavigationLink value="settings">
 *       <Text>Settings</Text>
 *     </NavigationLink>
 *   </List>
 *   <NavigationDestination value="settings">
 *     <SettingsScreen />
 *   </NavigationDestination>
 * </NavigationStack>
 * ```
 *
 * @platform ios
 */
export declare function NavigationStack(props: NavigationStackProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map
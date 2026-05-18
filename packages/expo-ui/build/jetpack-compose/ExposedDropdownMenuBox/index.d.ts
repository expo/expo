import type { ReactNode } from 'react';
import { type ModifierConfig } from '../../types';
export type ExposedDropdownMenuBoxProps = {
    /**
     * Whether the dropdown menu is expanded (visible).
     */
    expanded: boolean;
    /**
     * Callback when the expanded state changes (for example, tapping the field or dismissing the menu).
     */
    onExpandedChange?: (expanded: boolean) => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children — should contain an anchor element with the `menuAnchor()` modifier
     * and an `ExposedDropdownMenu` with `DropdownMenuItem` children.
     */
    children?: ReactNode;
};
/**
 * A Material 3 `ExposedDropdownMenuBox`.
 *
 * Use the `menuAnchor()` modifier on the anchor content (e.g. a `TextField` or `Text`).
 * Use `ExposedDropdownMenu` to wrap `DropdownMenuItem` children.
 *
 * @example
 * ```tsx
 * <ExposedDropdownMenuBox expanded={expanded} onExpandedChange={setExpanded}>
 *   <TextField modifiers={[menuAnchor()]} defaultValue={value} readOnly />
 *   <ExposedDropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
 *     <DropdownMenuItem onClick={() => { setSelected('a'); setExpanded(false); }}>
 *       <DropdownMenuItem.Text><Text>Option A</Text></DropdownMenuItem.Text>
 *     </DropdownMenuItem>
 *   </ExposedDropdownMenu>
 * </ExposedDropdownMenuBox>
 * ```
 */
export declare function ExposedDropdownMenuBox(props: ExposedDropdownMenuBoxProps): import("react/jsx-runtime").JSX.Element;
export { ExposedDropdownMenu, type ExposedDropdownMenuProps } from './ExposedDropdownMenu';
//# sourceMappingURL=index.d.ts.map
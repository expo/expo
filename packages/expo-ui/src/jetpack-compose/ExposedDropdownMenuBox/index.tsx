import { requireNativeView } from 'expo';
import type { ReactNode } from 'react';
import type { NativeSyntheticEvent } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

const NativeView: React.ComponentType<NativeExposedDropdownMenuBoxProps> = requireNativeView(
  'ExpoUI',
  'ExposedDropdownMenuBoxView'
);

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

type NativeExposedDropdownMenuBoxProps = Omit<
  ExposedDropdownMenuBoxProps,
  'onExpandedChange' | 'children'
> & {
  onExpandedChange?: (event: NativeSyntheticEvent<{ value: boolean }>) => void;
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
export function ExposedDropdownMenuBox(props: ExposedDropdownMenuBoxProps) {
  const { modifiers, onExpandedChange, children, ...restProps } = props;
  return (
    <NativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onExpandedChange={
        onExpandedChange ? ({ nativeEvent: { value } }) => onExpandedChange(value) : undefined
      }>
      {children}
    </NativeView>
  );
}
export { ExposedDropdownMenu, type ExposedDropdownMenuProps } from './ExposedDropdownMenu';

import type { SFSymbol } from 'sf-symbols-typescript';
import { type CommonViewModifierProps } from '../types';
export type PickerProps = {
    /**
     * The name of the system image (SF Symbol).
     * For example: 'photo', 'heart.fill', 'star.circle'
     */
    systemImage?: SFSymbol;
    /**
     * A label displayed on the picker.
     */
    label?: string | React.ReactNode;
    /**
     * The selected option's `tag` modifier value.
     */
    selection?: string | number | null;
    /**
     * Callback function that is called when an option is selected.
     * Gets called with the selected `tag` value.
     */
    onSelectionChange?: (event: {
        nativeEvent: {
            selection: string | number;
        };
    }) => void;
    /**
     * The content of the picker. You can use `Text` components with `tag` modifiers to display the options.
     */
    children?: React.ReactNode;
} & CommonViewModifierProps;
/**
 * Displays a native picker component
 * @example
 * ```tsx
 * <Picker modifiers={[pickerStyle('segmented')]}>
 *   <Text modifiers={[tag('option1')]}>Option 1</Text>
 *   <Text modifiers={[tag(0)]}>Option 3</Text>
 * </Picker>
 * ```
 */
export declare function Picker(props: PickerProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map
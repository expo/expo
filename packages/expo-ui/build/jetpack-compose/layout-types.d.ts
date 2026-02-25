import { ExpoModifier } from '../types';
export type PrimitiveBaseProps = {
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
export type HorizontalArrangement = 'start' | 'end' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly' | {
    spacedBy: number;
};
export type VerticalArrangement = 'top' | 'bottom' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly' | {
    spacedBy: number;
};
export type HorizontalAlignment = 'start' | 'end' | 'center';
export type VerticalAlignment = 'top' | 'bottom' | 'center';
export type ContentAlignment = 'topStart' | 'topCenter' | 'topEnd' | 'centerStart' | 'center' | 'centerEnd' | 'bottomStart' | 'bottomCenter' | 'bottomEnd';
export type FloatingToolbarExitAlwaysScrollBehavior = 'top' | 'bottom' | 'start' | 'end';
export declare function transformProps<T extends PrimitiveBaseProps>(props: T): {
    onGlobalEvent?: ((event: {
        nativeEvent: {
            payload: [eventName: string, params: Record<string, any>];
        };
    }) => void) | undefined;
    modifiers: import("../types").ModifierConfig[] | undefined;
} & Omit<T, "modifiers">;
//# sourceMappingURL=layout-types.d.ts.map
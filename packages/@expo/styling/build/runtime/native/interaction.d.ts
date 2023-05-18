import { GestureResponderEvent, LayoutChangeEvent, NativeSyntheticEvent, TargetedEvent } from "react-native";
import { Interaction, InteropMeta } from "../../types";
export declare function useInteractionSignals(): Interaction;
export declare function useInteractionHandlers(props: Record<string, any>, signals: Interaction, meta: InteropMeta): Partial<{
    onPress(event: GestureResponderEvent): void;
    onPressIn(event: GestureResponderEvent): void;
    onPressOut(event: GestureResponderEvent): void;
    onHoverIn(event: MouseEvent): void;
    onHoverOut(event: MouseEvent): void;
    onFocus(event: NativeSyntheticEvent<TargetedEvent>): void;
    onBlur(event: NativeSyntheticEvent<TargetedEvent>): void;
    onLayout(event: LayoutChangeEvent): void;
}>;
//# sourceMappingURL=interaction.d.ts.map
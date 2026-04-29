import { frame, type ModifierConfig } from '@expo/ui/swift-ui/modifiers';
import type { UniversalTextStyle } from './Text/types';
import type { UniversalBaseProps, UniversalStyle } from './types';
/**
 * Converts universal style/event/lifecycle/behavior props into a SwiftUI
 * modifier array.
 *
 * SwiftUI modifiers apply inside-out (each modifier wraps the previous).
 * To match React Native's box model (background fills the full box):
 *   padding → sizing → background → clip → border → opacity
 *   → events → lifecycle → behavior → user escape-hatch
 */
export declare function transformToModifiers(style: UniversalStyle | undefined, props: Pick<UniversalBaseProps, 'onPress' | 'onAppear' | 'onDisappear' | 'disabled' | 'hidden' | 'testID'>, extraModifiers?: ModifierConfig[], options?: {
    /** Alignment for the frame modifier (used by Column/Row). */
    frameAlignment?: Parameters<typeof frame>[0]['alignment'];
    /** Text-styling props for text-rendering components. */
    textStyle?: UniversalTextStyle;
}): ModifierConfig[];
//# sourceMappingURL=transformStyle.ios.d.ts.map
import { type ModifierConfig } from '@expo/ui/jetpack-compose/modifiers';
import type { UniversalBaseProps, UniversalStyle } from './types';
/**
 * Converts universal style/event/lifecycle/behavior props into a Jetpack
 * Compose modifier array.
 *
 * Compose modifiers apply outside-in (left to right). To match React Native's
 * box model where background includes the padding area and border is outermost:
 *   sizing → border → clip → background → padding → opacity
 *   → events → behavior → user escape-hatch
 */
export declare function transformToModifiers(style: UniversalStyle | undefined, props: Pick<UniversalBaseProps, 'onPress' | 'disabled' | 'hidden' | 'testID'>, extraModifiers?: ModifierConfig[]): ModifierConfig[];
//# sourceMappingURL=transformStyle.android.d.ts.map
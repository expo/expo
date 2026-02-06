import { AnimationObject, ChainableAnimationType, InterpolatingSpringAnimationParams, SpringAnimationParams, TimingAnimationParams } from './types';
/**
 * Built-in animation presets for the `animation` modifier.
 * Presets:
 * - Timing presets (`easeInOut`, `easeIn`, `easeOut`, `linear`) accept
 * [`TimingAnimationParams`](#timinganimationparams).
 * - `spring` accepts [`SpringAnimationParams`](#springanimationparams).
 * - `interpolatingSpring` accepts
 * [`InterpolatingSpringAnimationParams`](#interpolatingspringanimationparams).
 * - Chaining returns [`ChainableAnimationType`](#chainableanimationtype).
 *
 * @example
 * ```tsx
 * import { Host, VStack } from '@expo/ui/swift-ui';
 * import { animation, Animation } from '@expo/ui/swift-ui/modifiers';
 *
 * function Example() {
 *   const [isExpanded, setIsExpanded] = useState(false);
 *
 *   return (
 *     <Host style={{ flex: 1 }}>
 *       <VStack modifiers={[animation(Animation.spring({ duration: 0.8 }), isExpanded)]}>
 *         //...
 *       </VStack>
 *     </Host>
 *   );
 * }
 * ```
 * @hideType
 */
export declare const Animation: {
    easeInOut: (params?: TimingAnimationParams) => ChainableAnimationType;
    easeIn: (params?: TimingAnimationParams) => ChainableAnimationType;
    easeOut: (params?: TimingAnimationParams) => ChainableAnimationType;
    linear: (params?: TimingAnimationParams) => ChainableAnimationType;
    spring: (params?: SpringAnimationParams) => ChainableAnimationType;
    interpolatingSpring: (params?: InterpolatingSpringAnimationParams) => ChainableAnimationType;
    default: ChainableAnimationType;
};
declare function ChainableAnimation(animation: AnimationObject): ChainableAnimationType;
export declare const animation: (animationObject: ReturnType<typeof ChainableAnimation>, animatedValue: number | boolean) => import("..").ModifierConfig;
export {};
//# sourceMappingURL=index.d.ts.map
import { createModifier } from '../createModifier';
import { VALUE_SYMBOL } from './constants';
import type {
  AnimationObject,
  ChainableAnimationType,
  InterpolatingSpringAnimationParams,
  SpringAnimationParams,
  SpringPresetAnimationParams,
  TimingAnimationParams,
} from './types';

/**
 * Built-in animation presets for the `animation` modifier.
 * Presets:
 * - Timing presets (`easeInOut`, `easeIn`, `easeOut`, `linear`) accept
 * [`TimingAnimationParams`](#timinganimationparams).
 * - `spring` accepts [`SpringAnimationParams`](#springanimationparams).
 * - `interpolatingSpring` accepts
 * [`InterpolatingSpringAnimationParams`](#interpolatingspringanimationparams).
 * - Spring presets (`smooth`, `snappy`, `bouncy`) accept
 * [`SpringPresetAnimationParams`](#springpresetanimationparams).
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
export const Animation = {
  // timing animations
  easeInOut: (params?: TimingAnimationParams) =>
    ChainableAnimation({
      type: 'easeInOut',
      duration: params?.duration,
    }),
  easeIn: (params?: TimingAnimationParams) =>
    ChainableAnimation({
      type: 'easeIn',
      duration: params?.duration,
    }),
  easeOut: (params?: TimingAnimationParams) =>
    ChainableAnimation({
      type: 'easeOut',
      duration: params?.duration,
    }),
  linear: (params?: TimingAnimationParams) =>
    ChainableAnimation({
      type: 'linear',
      duration: params?.duration,
    }),

  // spring animations
  spring: (params?: SpringAnimationParams) =>
    ChainableAnimation({
      type: 'spring',
      response: params?.response,
      dampingFraction: params?.dampingFraction,
      blendDuration: params?.blendDuration,
      duration: params?.duration,
      bounce: params?.bounce,
    }),
  interpolatingSpring: (params?: InterpolatingSpringAnimationParams) =>
    ChainableAnimation({
      type: 'interpolatingSpring',
      mass: params?.mass,
      stiffness: params?.stiffness,
      damping: params?.damping,
      initialVelocity: params?.initialVelocity,
      duration: params?.duration,
      bounce: params?.bounce,
    }),
  smooth: (params?: SpringPresetAnimationParams) =>
    ChainableAnimation({
      type: 'smooth',
      duration: params?.duration,
      extraBounce: params?.extraBounce,
    }),
  snappy: (params?: SpringPresetAnimationParams) =>
    ChainableAnimation({
      type: 'snappy',
      duration: params?.duration,
      extraBounce: params?.extraBounce,
    }),
  bouncy: (params?: SpringPresetAnimationParams) =>
    ChainableAnimation({
      type: 'bouncy',
      duration: params?.duration,
      extraBounce: params?.extraBounce,
    }),

  default: ChainableAnimation({ type: 'default' }),
};

function ChainableAnimation(animation: AnimationObject): ChainableAnimationType {
  return {
    delay: (delay) => ChainableAnimation({ ...animation, delay }),
    repeat: (params) => ChainableAnimation({ ...animation, ...params }),
    [VALUE_SYMBOL]: () => animation,
  };
}

export const animation = (
  animationObject: ReturnType<typeof ChainableAnimation>,
  animatedValue: number | boolean
) => {
  return createModifier('animation', { animation: animationObject[VALUE_SYMBOL](), animatedValue });
};

// AnimationSpec factories — return typed JSON matching Compose's AnimationSpec subtypes

export const spring = (params?: {
  dampingRatio?: number;
  stiffness?: number;
  visibilityThreshold?: number;
}) => ({ $type: 'spring' as const, ...params });

export const tween = (params?: {
  durationMillis?: number;
  delayMillis?: number;
  easing?: 'linear' | 'fastOutSlowIn' | 'fastOutLinearIn' | 'linearOutSlowIn' | 'ease';
}) => ({ $type: 'tween' as const, ...params });

export const snap = (params?: { delayMillis?: number }) => ({
  $type: 'snap' as const,
  ...params,
});

export const keyframes = (params: {
  durationMillis: number;
  delayMillis?: number;
  keyframes: Record<number, number>;
}) => ({ $type: 'keyframes' as const, ...params });

export type AnimationSpec = ReturnType<
  typeof spring | typeof tween | typeof snap | typeof keyframes
>;

// animated() wrapper — wraps a target value with an animation spec
export const animated = (targetValue: number, spec: AnimationSpec = spring()) => ({
  $animated: true as const,
  targetValue,
  animationSpec: spec,
});

export type AnimatedValue = ReturnType<typeof animated>;

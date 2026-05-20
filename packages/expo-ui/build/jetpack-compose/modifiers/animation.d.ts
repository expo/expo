export declare const spring: (params?: {
    dampingRatio?: number;
    stiffness?: number;
    visibilityThreshold?: number;
}) => {
    dampingRatio?: number;
    stiffness?: number;
    visibilityThreshold?: number;
    $type: "spring";
};
export declare const tween: (params?: {
    durationMillis?: number;
    delayMillis?: number;
    easing?: "linear" | "fastOutSlowIn" | "fastOutLinearIn" | "linearOutSlowIn" | "ease";
}) => {
    durationMillis?: number;
    delayMillis?: number;
    easing?: "linear" | "fastOutSlowIn" | "fastOutLinearIn" | "linearOutSlowIn" | "ease";
    $type: "tween";
};
export declare const snap: (params?: {
    delayMillis?: number;
}) => {
    delayMillis?: number;
    $type: "snap";
};
export declare const keyframes: (params: {
    durationMillis: number;
    delayMillis?: number;
    keyframes: Record<number, number>;
}) => {
    durationMillis: number;
    delayMillis?: number;
    keyframes: Record<number, number>;
    $type: "keyframes";
};
export type AnimationSpec = ReturnType<typeof spring | typeof tween | typeof snap | typeof keyframes>;
export declare const animated: (targetValue: number, spec?: AnimationSpec) => {
    $animated: true;
    targetValue: number;
    animationSpec: AnimationSpec;
};
export type AnimatedValue = ReturnType<typeof animated>;
//# sourceMappingURL=animation.d.ts.map
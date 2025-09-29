export declare const RoundedRectangularShape: {
    rect: (cornerRadius?: number) => {
        cornerRadius: number | undefined;
    };
};
/**
 * Sets the container shape for the view.
 * @param shape - A shape configuration from RoundedRectangularShape.rect()
 */
export declare const containerShape: (shape: ReturnType<typeof RoundedRectangularShape.rect>) => import("./createModifier").ModifierConfig;
//# sourceMappingURL=containerShape.d.ts.map
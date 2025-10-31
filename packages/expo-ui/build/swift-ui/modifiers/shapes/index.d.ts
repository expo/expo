export declare const shapes: {
    roundedRectangle: (params: {
        cornerRadius?: number;
        roundedCornerStyle?: "continuous" | "circular";
        cornerSize?: number;
    }) => {
        cornerRadius: number | undefined;
        roundedCornerStyle: "circular" | "continuous" | undefined;
        cornerSize: number | undefined;
        shape: string;
    };
    capsule: (params?: {
        roundedCornerStyle?: "continuous" | "circular";
    }) => {
        roundedCornerStyle: "circular" | "continuous" | undefined;
        shape: string;
    };
    rectangle: () => {
        shape: string;
    };
    ellipse: () => {
        shape: string;
    };
    circle: () => {
        shape: string;
    };
};
export type Shape = ReturnType<typeof shapes.roundedRectangle> | ReturnType<typeof shapes.capsule> | ReturnType<typeof shapes.rectangle> | ReturnType<typeof shapes.ellipse> | ReturnType<typeof shapes.circle>;
//# sourceMappingURL=index.d.ts.map
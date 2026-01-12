export declare const shapes: {
    roundedRectangle: (params: {
        cornerRadius?: number;
        roundedCornerStyle?: "continuous" | "circular";
        cornerSize?: {
            width: number;
            height: number;
        };
    }) => {
        cornerRadius: number | undefined;
        roundedCornerStyle: "continuous" | "circular" | undefined;
        cornerSize: {
            width: number;
            height: number;
        } | undefined;
        shape: string;
    };
    capsule: (params?: {
        roundedCornerStyle?: "continuous" | "circular";
    }) => {
        roundedCornerStyle: "continuous" | "circular" | undefined;
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
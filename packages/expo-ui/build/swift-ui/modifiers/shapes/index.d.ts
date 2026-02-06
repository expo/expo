/**
 * Shape builders for modifiers that accept shapes, such as `background` and `containerShape`.
 *
 * Shapes: `roundedRectangle`, `capsule`, `rectangle`, `ellipse`, `circle`.
 *
 * @example
 * ```tsx
 * import { background, shapes } from '@expo/ui/swift-ui/modifiers';
 * import { Text, Host } from '@expo/ui/swift-ui';
 *
 * function Example() {
 *   return (
 *     <Host>
 *     <Text
 *       modifiers={[
 *         background('#000', shapes.roundedRectangle({ cornerRadius: 12 })),
 *       ]}
 *     >
 *       Hello, world!
 *     </Text>
 *   </Host>
 *   );
 * }
 * ```
 * @hideType
 */
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
        roundedCornerStyle: "circular" | "continuous" | undefined;
        cornerSize: {
            width: number;
            height: number;
        } | undefined;
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
type StackBaseProps = {
    children: React.ReactNode;
    spacing?: number;
    padding?: number;
    frame?: {
        width?: number;
        height?: number;
        minWidth?: number;
        minHeight?: number;
        maxWidth?: number;
        maxHeight?: number;
    };
};
export type HStackProps = StackBaseProps;
export declare function HStack(props: HStackProps): import("react").JSX.Element;
export type VStackProps = StackBaseProps;
export declare function VStack(props: VStackProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=Layout.d.ts.map
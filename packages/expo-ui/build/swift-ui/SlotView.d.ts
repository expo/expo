type SlotProps<ExtraProps extends Record<string, unknown> = Record<string, unknown>> = {
    name: string;
    extraProps?: ExtraProps;
    children?: React.ReactNode;
};
export declare function Slot<ExtraProps extends Record<string, unknown> = Record<string, unknown>>({ name, extraProps, children, }: SlotProps<ExtraProps>): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=SlotView.d.ts.map
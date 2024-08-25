export type SystemBarStyle = 'auto' | 'light' | 'dark';
export type SystemBarsProps = {
    statusBarStyle?: SystemBarStyle;
    statusBarHidden?: boolean;
    navigationBarHidden?: boolean;
};
export declare function SystemBars({ statusBarStyle, statusBarHidden, navigationBarHidden, }: SystemBarsProps): null;
export declare namespace SystemBars {
    var pushStackEntry: (props: SystemBarsProps) => SystemBarsProps;
    var popStackEntry: (entry: SystemBarsProps) => void;
    var replaceStackEntry: (entry: SystemBarsProps, props: SystemBarsProps) => SystemBarsProps;
}
//# sourceMappingURL=SystemBars.d.ts.map
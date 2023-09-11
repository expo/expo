export type ExpoDevMenuItem = {
    name: string;
    callback: () => void;
    shouldCollapse?: boolean;
};
export type ExpoDevMenu = {
    openMenu(): any;
    closeMenu(): any;
    hideMenu(): any;
    addDevMenuCallbacks(callbacks: {
        name: string;
        shouldCollapse?: boolean;
    }[]): any;
};
//# sourceMappingURL=ExpoDevMenu.types.d.ts.map
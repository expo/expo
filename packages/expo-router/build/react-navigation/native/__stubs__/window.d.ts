export declare const window: {
    document: {
        title: string;
    };
    readonly location: URL;
    history: {
        readonly state: any;
        pushState(state: any, _: string, path: string): void;
        replaceState(state: any, _: string, path: string): void;
        go(n: number): void;
        back(): void;
        forward(): void;
    };
    addEventListener: (type: "popstate", listener: () => void) => void;
    removeEventListener: (type: "popstate", listener: () => void) => void;
    readonly window: /*elided*/ any;
};
//# sourceMappingURL=window.d.ts.map
type RootModalContextValue = {
    root: boolean;
    routes: never[];
    addModal: (name: string) => void;
    removeModal: (name: string) => void;
};
export declare const RootModalContext: import("react").Context<RootModalContextValue>;
export declare function RootModalProvider({ children }: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export {};
//# sourceMappingURL=RootModal.d.ts.map
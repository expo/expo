interface RNHostViewProps {
    /**
     * When true, the RNHost will update its size in the React Native view tree to match the children's size.
     * When false, the RNHost will use the size of the parent SwiftUI View.
     * Can be only set once on mount.
     * @default false
     */
    matchContents?: boolean;
    /**
     * The RN View to be hosted.
     */
    children: React.ReactElement;
}
export declare function RNHostView(props: RNHostViewProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=RNHostView.d.ts.map
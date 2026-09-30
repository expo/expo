import type { LayoutChangeEvent } from 'react-native';
export interface RNHostViewProps {
    /**
     * When `true`, the RNHost will update its size in the React Native view tree to match the
     * children's size.
     * When `false`, the RNHost will use the size of the parent SwiftUI View.
     * Pass an object to choose per axis. For example, `{ vertical: true }` takes the width from the
     * parent and the height from the children, so text wraps and grows vertically.
     * Can be only set once on mount.
     * @default false
     */
    matchContents?: boolean | {
        vertical?: boolean;
        horizontal?: boolean;
    };
    onLayout?: (event: LayoutChangeEvent) => void;
    /**
     * The RN View to be hosted.
     */
    children: React.ReactElement;
}
export declare function RNHostView({ matchContents, ...props }: RNHostViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RNHostView.d.ts.map
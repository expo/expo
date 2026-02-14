import type { ImageRef } from 'expo-image';
import { type PropsWithChildren } from 'react';
import { type ViewProps, type ColorValue } from 'react-native';
import type { BasicTextStyle } from '../../utils/font';
export interface NativeLinkPreviewActionProps {
    identifier: string;
    title: string;
    label?: string;
    icon?: string;
    xcassetName?: string;
    image?: ImageRef | null;
    imageRenderingMode?: 'template' | 'original';
    children?: React.ReactNode;
    disabled?: boolean;
    destructive?: boolean;
    discoverabilityLabel?: string;
    subtitle?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    displayAsPalette?: boolean;
    displayInline?: boolean;
    preferredElementSize?: 'auto' | 'small' | 'medium' | 'large';
    isOn?: boolean;
    keepPresented?: boolean;
    hidden?: boolean;
    tintColor?: ColorValue;
    barButtonItemStyle?: 'plain' | 'prominent';
    sharesBackground?: boolean;
    hidesSharedBackground?: boolean;
    onSelected: () => void;
    titleStyle?: BasicTextStyle;
}
export declare function NativeLinkPreviewAction(props: NativeLinkPreviewActionProps): import("react").JSX.Element | null;
export interface TabPath {
    oldTabKey: string;
    newTabKey: string;
}
export interface NativeLinkPreviewProps extends ViewProps {
    nextScreenId: string | undefined;
    tabPath: {
        path: TabPath[];
    } | undefined;
    disableForceFlatten?: boolean;
    onWillPreviewOpen?: () => void;
    onDidPreviewOpen?: () => void;
    onPreviewWillClose?: () => void;
    onPreviewDidClose?: () => void;
    onPreviewTapped?: () => void;
    onPreviewTappedAnimationCompleted?: () => void;
    children: React.ReactNode;
}
export declare function NativeLinkPreview(props: NativeLinkPreviewProps): import("react").JSX.Element | null;
export interface NativeLinkPreviewContentProps extends ViewProps {
    preferredContentSize?: {
        width: number;
        height: number;
    };
}
export declare function NativeLinkPreviewContent(props: NativeLinkPreviewContentProps): import("react").JSX.Element | null;
interface DismissalBoundsRect {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
}
export declare function LinkZoomTransitionEnabler(props: {
    zoomTransitionSourceIdentifier: string;
    dismissalBoundsRect?: DismissalBoundsRect | null;
}): import("react").JSX.Element | null;
interface LinkSourceAlignmentRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface LinkZoomTransitionSourceProps extends PropsWithChildren {
    identifier: string;
    alignment?: LinkSourceAlignmentRect;
    animateAspectRatioChange?: boolean;
}
export declare function LinkZoomTransitionSource(props: LinkZoomTransitionSourceProps): import("react").JSX.Element | null;
export declare function LinkZoomTransitionAlignmentRectDetector(props: {
    identifier: string;
    children: React.ReactNode;
}): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=native.d.ts.map
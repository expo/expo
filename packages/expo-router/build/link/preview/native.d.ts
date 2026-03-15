import type { ImageRef } from 'expo-image';
import { type PropsWithChildren } from 'react';
import { type ViewProps, type ColorValue } from 'react-native';
import type { BasicTextStyle } from '../../utils/font';
export interface NativeLinkPreviewActionProps {
    identifier: string;
    title: string;
    label?: string | undefined;
    icon?: string | undefined;
    xcassetName?: string | undefined;
    image?: ImageRef | null | undefined;
    imageRenderingMode?: 'template' | 'original' | undefined;
    children?: React.ReactNode | undefined;
    disabled?: boolean | undefined;
    destructive?: boolean | undefined;
    discoverabilityLabel?: string | undefined;
    subtitle?: string | undefined;
    accessibilityLabel?: string | undefined;
    accessibilityHint?: string | undefined;
    displayAsPalette?: boolean | undefined;
    displayInline?: boolean | undefined;
    preferredElementSize?: 'auto' | 'small' | 'medium' | 'large' | undefined;
    isOn?: boolean | undefined;
    keepPresented?: boolean | undefined;
    hidden?: boolean | undefined;
    tintColor?: ColorValue | undefined;
    barButtonItemStyle?: 'plain' | 'prominent' | undefined;
    sharesBackground?: boolean | undefined;
    hidesSharedBackground?: boolean | undefined;
    onSelected: () => void;
    titleStyle?: BasicTextStyle | undefined;
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
    disableForceFlatten?: boolean | undefined;
    onWillPreviewOpen?: (() => void) | undefined;
    onDidPreviewOpen?: (() => void) | undefined;
    onPreviewWillClose?: (() => void) | undefined;
    onPreviewDidClose?: (() => void) | undefined;
    onPreviewTapped?: (() => void) | undefined;
    onPreviewTappedAnimationCompleted?: (() => void) | undefined;
    children: React.ReactNode;
}
export declare function NativeLinkPreview(props: NativeLinkPreviewProps): import("react").JSX.Element | null;
export interface NativeLinkPreviewContentProps extends ViewProps {
    preferredContentSize?: {
        width: number;
        height: number;
    } | undefined;
}
export declare function NativeLinkPreviewContent(props: NativeLinkPreviewContentProps): import("react").JSX.Element | null;
interface DismissalBoundsRect {
    minX?: number | undefined;
    maxX?: number | undefined;
    minY?: number | undefined;
    maxY?: number | undefined;
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
    alignment?: LinkSourceAlignmentRect | undefined;
    animateAspectRatioChange?: boolean | undefined;
}
export declare function LinkZoomTransitionSource(props: LinkZoomTransitionSourceProps): import("react").JSX.Element | null;
export declare function LinkZoomTransitionAlignmentRectDetector(props: {
    identifier: string;
    children: React.ReactNode;
}): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=native.d.ts.map
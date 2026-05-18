import type { Layout, SceneProgress, StackHeaderOptions, StackHeaderStyleInterpolator } from '../../types';
type Props = Omit<StackHeaderOptions, 'headerStatusBarHeight'> & {
    headerStatusBarHeight: number;
    layout: Layout;
    title: string;
    modal: boolean;
    onGoBack?: () => void;
    backHref?: string;
    progress: SceneProgress;
    styleInterpolator: StackHeaderStyleInterpolator;
};
export declare function HeaderSegment(props: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=HeaderSegment.d.ts.map
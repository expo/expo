import React from 'react';
import { BlurMethod, BlurViewProps } from './BlurView.types';
type BlurViewState = {
    blurTargetId?: number | null;
};
export default class BlurView extends React.Component<BlurViewProps, BlurViewState> {
    constructor(props: BlurViewProps);
    blurViewRef?: React.RefObject<React.ComponentType<any> | null> | undefined;
    /**
     * @hidden
     * When Animated.createAnimatedComponent(BlurView) is used Reanimated will detect and call this
     * function to determine which component should be animated. We want to animate the NativeBlurView.
     */
    getAnimatableRef(): React.ComponentType<any> | null | undefined;
    componentDidMount(): void;
    componentDidUpdate(prevProps: Readonly<BlurViewProps>): void;
    _maybeWarnAboutBlurMethod(): void;
    _updateBlurTargetId: () => void;
    _getBlurMethod(): BlurMethod;
    render(): React.JSX.Element;
}
export {};
//# sourceMappingURL=BlurView.d.ts.map
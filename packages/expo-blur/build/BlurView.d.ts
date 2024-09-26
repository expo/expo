import React from 'react';
import { BlurViewProps } from './BlurView.types';
export default class BlurView extends React.Component<BlurViewProps> {
    blurViewRef?: React.RefObject<React.ComponentType<any>> | undefined;
    /**
     * @hidden
     * When Animated.createAnimatedComponent(BlurView) is used Reanimated will detect and call this
     * function to determine which component should be animated. We want to animate the NativeBlurView.
     */
    getAnimatableRef(): React.ComponentType<any> | null | undefined;
    render(): React.JSX.Element;
}
//# sourceMappingURL=BlurView.d.ts.map
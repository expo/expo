import React from 'react';
import { BlurViewProps } from './BlurView.types';
declare const NativeBlurView: React.ComponentType<any>;
export default class BlurView extends React.Component<BlurViewProps> {
    blurViewRef: React.Ref<typeof NativeBlurView>;
    /**
     * When Animated.createAnimatedComponent(BlurView) is used Reanimated will detect and call this
     * function to determine which component should be animated. We want to animate the NativeBlurView.
     */
    getAnimatableRef(): React.Ref<React.ComponentType<any>>;
    render(): JSX.Element;
}
export {};
//# sourceMappingURL=BlurView.d.ts.map
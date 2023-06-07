import * as React from 'react';
import { BlurViewProps } from './BlurView.types';
export default class BlurView extends React.Component<BlurViewProps> {
    private blurViewRef;
    /**
     * Reanimated will detect and call this function with animated styles passed as props on every
     * animation frame. We want to extract intensity from the props, then create and apply new styles,
     * which create the blur based on the intensity and current tint.
     */
    setNativeProps(nativeProps: any): void;
    render(): JSX.Element;
}
//# sourceMappingURL=BlurView.web.d.ts.map
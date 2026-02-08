// Copyright © 2024 650 Industries.
'use client';
import React from 'react';
import { View, StyleSheet, findNodeHandle, Platform } from 'react-native';
import { NativeBlurView } from './NativeBlurModule';
// TODO: Class components are not supported with React Server Components.
export default class BlurView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            blurTargetId: undefined,
        };
    }
    blurViewRef = React.createRef();
    /**
     * @hidden
     * When Animated.createAnimatedComponent(BlurView) is used Reanimated will detect and call this
     * function to determine which component should be animated. We want to animate the NativeBlurView.
     */
    getAnimatableRef() {
        return this.blurViewRef?.current;
    }
    componentDidMount() {
        this._updateBlurTargetId();
        this._maybeWarnAboutBlurMethod();
        if (this.props.experimentalBlurMethod != null) {
            console.warn('The `experimentalBlurMethod` prop has been depracated. Please use the `blurMethod` prop instead.');
        }
    }
    componentDidUpdate(prevProps) {
        if (prevProps.blurTarget?.current !== this.props.blurTarget?.current) {
            this._updateBlurTargetId();
        }
    }
    _maybeWarnAboutBlurMethod() {
        const blurMethod = this._getBlurMethod();
        if (Platform.OS === 'android' &&
            (blurMethod === 'dimezisBlurView' || blurMethod === 'dimezisBlurViewSdk31Plus') &&
            !this.props.blurTarget) {
            // The fallback happens on the native side
            console.warn(`You have selected the "${blurMethod}" blur method, but the \`blurTarget\` prop has not been configured. The blur view will fallback to "none" blur method to avoid errors. You can learn more about the new BlurView API at: https://docs.expo.dev/versions/latest/sdk/blur-view/`);
        }
    }
    _updateBlurTargetId = () => {
        const blurTarget = this.props.blurTarget?.current;
        const blurTargetId = blurTarget ? findNodeHandle(blurTarget) : undefined;
        this.setState(() => ({
            blurTargetId,
        }));
    };
    _getBlurMethod() {
        const providedMethod = this.props.blurMethod ?? this.props.experimentalBlurMethod;
        return providedMethod ?? 'none';
    }
    render() {
        const { tint = 'default', intensity = 50, blurReductionFactor = 4, style, children, ...props } = this.props;
        const flattenedStyle = StyleSheet.flatten(style);
        return (<View {...props} style={[styles.container, style]}>
        <NativeBlurView blurTargetId={this.state.blurTargetId} ref={this.blurViewRef} tint={tint} intensity={intensity} blurReductionFactor={blurReductionFactor} blurMethod={this._getBlurMethod()} style={[
                StyleSheet.absoluteFill,
                {
                    borderRadius: flattenedStyle?.borderRadius,
                    borderTopLeftRadius: flattenedStyle?.borderTopLeftRadius,
                    borderTopRightRadius: flattenedStyle?.borderTopRightRadius,
                    borderBottomLeftRadius: flattenedStyle?.borderBottomLeftRadius,
                    borderBottomRightRadius: flattenedStyle?.borderBottomRightRadius,
                    borderTopStartRadius: flattenedStyle?.borderTopStartRadius,
                    borderTopEndRadius: flattenedStyle?.borderTopEndRadius,
                    borderBottomStartRadius: flattenedStyle?.borderBottomStartRadius,
                    borderBottomEndRadius: flattenedStyle?.borderBottomEndRadius,
                },
            ]}/>
        {children}
      </View>);
    }
}
const styles = StyleSheet.create({
    container: { backgroundColor: 'transparent' },
});
//# sourceMappingURL=BlurView.js.map
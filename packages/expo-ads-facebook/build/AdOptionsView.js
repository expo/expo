import { requireNativeViewManager } from 'expo-modules-core';
import nullthrows from 'nullthrows';
import React from 'react';
import { Platform, findNodeHandle } from 'react-native';
import { AdOptionsViewContext } from './withNativeAd';
var NativeOrientation;
(function (NativeOrientation) {
    NativeOrientation[NativeOrientation["Horizontal"] = 0] = "Horizontal";
    NativeOrientation[NativeOrientation["Vertical"] = 1] = "Vertical";
})(NativeOrientation || (NativeOrientation = {}));
export default class AdOptionsView extends React.Component {
    static defaultProps = {
        iconSize: 23,
        orientation: 'horizontal',
    };
    shouldAlignHorizontal = () => this.props.orientation === 'horizontal';
    render() {
        const style = this.shouldAlignHorizontal()
            ? {
                width: this.props.iconSize * 2,
                height: this.props.iconSize,
            }
            : {
                width: this.props.iconSize,
                height: this.props.iconSize * 2,
            };
        const { iconSize, orientation, ...props } = this.props;
        const platformSpecificProps = Platform.OS === 'android'
            ? {
                iconSize,
                orientation: this.shouldAlignHorizontal()
                    ? NativeOrientation.Horizontal
                    : NativeOrientation.Vertical,
            }
            : null;
        return (React.createElement(AdOptionsViewContext.Consumer, null, (contextValue) => {
            const adViewRef = nullthrows(contextValue && contextValue.nativeAdViewRef);
            return (React.createElement(NativeAdOptionsView, { ...props, ...platformSpecificProps, style: [this.props.style, style], nativeAdViewTag: findNodeHandle(adViewRef.current) }));
        }));
    }
}
// eslint-disable-next-line @typescript-eslint/no-redeclare -- the type and variable share a name
export const NativeAdOptionsView = requireNativeViewManager('AdOptionsView');
//# sourceMappingURL=AdOptionsView.js.map
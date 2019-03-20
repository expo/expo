import nullthrows from 'nullthrows';
import React from 'react';
import { findNodeHandle } from 'react-native';
import { requireNativeViewManager } from '@unimodules/core';
import { AdChoiceViewContext } from './withNativeAd';
var NativeOrientation;
(function (NativeOrientation) {
    NativeOrientation[NativeOrientation["Horizontal"] = 0] = "Horizontal";
    NativeOrientation[NativeOrientation["Vertical"] = 1] = "Vertical";
})(NativeOrientation || (NativeOrientation = {}));
export default class AdChoiceView extends React.Component {
    constructor() {
        super(...arguments);
        this.shouldAlignHorizontal = () => this.props.orientation === 'horizontal';
    }
    render() {
        const style = this.shouldAlignHorizontal()
            ? {
                minWidth: this.props.iconSize * 2,
                minHeight: this.props.iconSize,
            }
            : {
                minWidth: this.props.iconSize,
                minHeight: this.props.iconSize * 2,
            };
        return (<AdChoiceViewContext.Consumer>
        {(contextValue) => {
            let adViewRef = nullthrows(contextValue && contextValue.nativeAdViewRef);
            return (<NativeAdChoiceView {...this.props} style={[this.props.style, style]} nativeAdViewTag={findNodeHandle(adViewRef.current)} orientation={this.shouldAlignHorizontal()
                ? NativeOrientation.Horizontal
                : NativeOrientation.Vertical}/>);
        }}
      </AdChoiceViewContext.Consumer>);
    }
}
AdChoiceView.defaultProps = {
    iconSize: 23,
    orientation: 'horizontal',
};
export const NativeAdChoiceView = requireNativeViewManager('AdChoiceView');
//# sourceMappingURL=AdChoiceView.js.map
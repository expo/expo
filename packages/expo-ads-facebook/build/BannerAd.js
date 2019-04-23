import React from 'react';
import { requireNativeViewManager } from '@unimodules/core';
export default class BannerAd extends React.Component {
    render() {
        let { type, onPress, onError, style, ...props } = this.props;
        let size = _getSizeForAdType(type);
        return (<NativeBannerView size={size} onAdPress={onPress} onAdError={onError} style={[style, { height: size }]} {...props}/>);
    }
}
function _getSizeForAdType(type) {
    const sizes = { standard: 50, large: 90, rectangle: 250 };
    return sizes.hasOwnProperty(type) ? sizes[type] : sizes.standard;
}
const NativeBannerView = requireNativeViewManager('CTKBannerView');
//# sourceMappingURL=BannerAd.js.map
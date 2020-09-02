import { requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';
import { View } from 'react-native';
let _hasWarnedAboutTestDeviceID = false;
export default class AdMobBanner extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { style: {} };
        this._handleSizeChange = ({ nativeEvent }) => {
            const { height, width } = nativeEvent;
            this.setState({ style: { width, height } });
        };
        this._handleDidFailToReceiveAdWithError = ({ nativeEvent }) => this.props.onDidFailToReceiveAdWithError &&
            this.props.onDidFailToReceiveAdWithError(nativeEvent.error);
    }
    render() {
        const additionalRequestParams = {
            ...this.props.additionalRequestParams,
        };
        if (!this.props.servePersonalizedAds) {
            additionalRequestParams.npa = '1';
        }
        if (this.props.testDeviceID && !_hasWarnedAboutTestDeviceID) {
            console.warn('The `testDeviceID` prop of AdMobBanner is deprecated. Test device IDs are now set globally. Use AdMob.setTestDeviceIDAsync instead.');
            _hasWarnedAboutTestDeviceID = true;
        }
        return (React.createElement(View, { style: this.props.style },
            React.createElement(ExpoBannerView, { style: this.state.style, adUnitID: this.props.adUnitID, bannerSize: this.props.bannerSize, onSizeChange: this._handleSizeChange, additionalRequestParams: additionalRequestParams, onAdViewDidReceiveAd: this.props.onAdViewDidReceiveAd, onDidFailToReceiveAdWithError: this._handleDidFailToReceiveAdWithError, onAdViewWillPresentScreen: this.props.onAdViewWillPresentScreen, onAdViewWillDismissScreen: this.props.onAdViewWillDismissScreen, onAdViewDidDismissScreen: this.props.onAdViewDidDismissScreen, onAdViewWillLeaveApplication: this.props.onAdViewWillLeaveApplication })));
    }
}
AdMobBanner.defaultProps = { bannerSize: 'smartBannerPortrait' };
const ExpoBannerView = requireNativeViewManager('ExpoAdsAdMobBannerView');
//# sourceMappingURL=AdMobBanner.js.map
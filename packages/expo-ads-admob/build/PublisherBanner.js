import { requireNativeViewManager } from 'expo-modules-core';
import React from 'react';
import { View } from 'react-native';
export default class PublisherBanner extends React.Component {
    static defaultProps = { bannerSize: 'smartBannerPortrait' };
    state = { style: {} };
    _handleSizeChange = ({ nativeEvent }) => {
        const { height, width } = nativeEvent;
        this.setState({ style: { width, height } });
    };
    _handleDidFailToReceiveAdWithError = ({ nativeEvent }) => this.props.onDidFailToReceiveAdWithError &&
        this.props.onDidFailToReceiveAdWithError(nativeEvent.error);
    render() {
        const additionalRequestParams = {
            ...this.props.additionalRequestParams,
        };
        if (!this.props.servePersonalizedAds) {
            additionalRequestParams.npa = '1';
        }
        return (React.createElement(View, { style: this.props.style },
            React.createElement(ExpoBannerView, { style: this.state.style, adUnitID: this.props.adUnitID, bannerSize: this.props.bannerSize, onSizeChange: this._handleSizeChange, additionalRequestParams: additionalRequestParams, onAdViewDidReceiveAd: this.props.onAdViewDidReceiveAd, onDidFailToReceiveAdWithError: this._handleDidFailToReceiveAdWithError, onAdViewWillPresentScreen: this.props.onAdViewWillPresentScreen, onAdViewWillDismissScreen: this.props.onAdViewWillDismissScreen, onAdViewDidDismissScreen: this.props.onAdViewDidDismissScreen, onAdmobDispatchAppEvent: this.props.onAdMobDispatchAppEvent })));
    }
}
const ExpoBannerView = requireNativeViewManager('ExpoAdsPublisherBannerView');
//# sourceMappingURL=PublisherBanner.js.map
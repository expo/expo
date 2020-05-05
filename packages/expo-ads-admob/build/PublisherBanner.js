import { requireNativeViewManager } from '@unimodules/core';
import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';
let _hasWarnedAboutTestDeviceID = false;
export default class PublisherBanner extends React.Component {
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
            console.warn('The `testDeviceID` prop of PublisherBanner is deprecated. Test device IDs are now set globally. Use AdMob.setTestDeviceID instead.');
            _hasWarnedAboutTestDeviceID = true;
        }
        return (<View style={this.props.style}>
        <ExpoBannerView style={this.state.style} adUnitID={this.props.adUnitID} bannerSize={this.props.bannerSize} onSizeChange={this._handleSizeChange} additionalRequestParams={additionalRequestParams} onAdViewDidReceiveAd={this.props.onAdViewDidReceiveAd} onDidFailToReceiveAdWithError={this._handleDidFailToReceiveAdWithError} onAdViewWillPresentScreen={this.props.onAdViewWillPresentScreen} onAdViewWillDismissScreen={this.props.onAdViewWillDismissScreen} onAdViewDidDismissScreen={this.props.onAdViewDidDismissScreen} onAdViewWillLeaveApplication={this.props.onAdViewWillLeaveApplication} onAdmobDispatchAppEvent={this.props.onAdMobDispatchAppEvent}/>
      </View>);
    }
}
PublisherBanner.propTypes = {
    bannerSize: PropTypes.oneOf([
        'banner',
        'largeBanner',
        'mediumRectangle',
        'fullBanner',
        'leaderboard',
        'smartBannerPortrait',
        'smartBannerLandscape',
    ]),
    adUnitID: PropTypes.string,
    servePersonalizedAds: PropTypes.bool,
    onAdViewDidReceiveAd: PropTypes.func,
    additionalRequestParams: PropTypes.object,
    onDidFailToReceiveAdWithError: PropTypes.func,
    onAdViewWillPresentScreen: PropTypes.func,
    onAdViewWillDismissScreen: PropTypes.func,
    onAdViewDidDismissScreen: PropTypes.func,
    onAdViewWillLeaveApplication: PropTypes.func,
    onAdmobDispatchAppEvent: PropTypes.func,
    ...ViewPropTypes,
};
PublisherBanner.defaultProps = { bannerSize: 'smartBannerPortrait' };
const ExpoBannerView = requireNativeViewManager('ExpoAdsPublisherBannerView');
//# sourceMappingURL=PublisherBanner.js.map
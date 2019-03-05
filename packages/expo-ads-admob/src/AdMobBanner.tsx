import { requireNativeViewManager } from '@unimodules/core';
import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';

type PropsType = React.ComponentProps<typeof View> & {
  /**
   * AdMob iOS library banner size constants
   * (https://developers.google.com/admob/ios/banner)
   * banner (320x50, Standard Banner for Phones and Tablets)
   * largeBanner (320x100, Large Banner for Phones and Tablets)
   * mediumRectangle (300x250, IAB Medium Rectangle for Phones and Tablets)
   * fullBanner (468x60, IAB Full-Size Banner for Tablets)
   * leaderboard (728x90, IAB Leaderboard for Tablets)
   * smartBannerPortrait (Screen width x 32|50|90, Smart Banner for Phones and Tablets)
   * smartBannerLandscape (Screen width x 32|50|90, Smart Banner for Phones and Tablets)
   *
   * banner is default
   */
  bannerSize:
    | 'banner'
    | 'largeBanner'
    | 'mediumRectangle'
    | 'fullBanner'
    | 'leaderboard'
    | 'smartBannerPortrait'
    | 'smartBannerLandscape',
  /**
   * AdMob ad unit ID
   */
  adUnitID?: string,

  /**
   * Test device ID
   */
  testDeviceID?: string,

  /**
   * AdMob iOS library events
   */
  onAdViewDidReceiveAd?: () => void,
  onDidFailToReceiveAdWithError?: (string) => void,
  onAdViewWillPresentScreen?: () => void,
  onAdViewWillDismissScreen?: () => void,
  onAdViewDidDismissScreen?: () => void,
  onAdViewWillLeaveApplication?: () => void,
};

type StateType = {
  style: { width?: number, height?: number },
};

export default class AdMobBanner extends React.Component<PropsType, StateType> {
  static propTypes = {
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
    testDeviceID: PropTypes.string,
    onAdViewDidReceiveAd: PropTypes.func,
    onDidFailToReceiveAdWithError: PropTypes.func,
    onAdViewWillPresentScreen: PropTypes.func,
    onAdViewWillDismissScreen: PropTypes.func,
    onAdViewDidDismissScreen: PropTypes.func,
    onAdViewWillLeaveApplication: PropTypes.func,
    ...ViewPropTypes,
  };

  static defaultProps = { bannerSize: 'smartBannerPortrait' };

  state = { style: {} };

  _handleSizeChange = ({ nativeEvent }: { nativeEvent: { width: number, height: number } }) => {
    const { height, width } = nativeEvent;
    this.setState({ style: { width, height } });
  };

  _handleDidFailToReceiveAdWithError = ({ nativeEvent }: { nativeEvent: { error: string } }) =>
    this.props.onDidFailToReceiveAdWithError &&
    this.props.onDidFailToReceiveAdWithError(nativeEvent.error);

  render() {
    return (
      <View style={this.props.style}>
        <ExpoBannerView
          style={this.state.style}
          adUnitID={this.props.adUnitID}
          bannerSize={this.props.bannerSize}
          testDeviceID={this.props.testDeviceID}
          onSizeChange={this._handleSizeChange}
          onAdViewDidReceiveAd={this.props.onAdViewDidReceiveAd}
          onDidFailToReceiveAdWithError={this._handleDidFailToReceiveAdWithError}
          onAdViewWillPresentScreen={this.props.onAdViewWillPresentScreen}
          onAdViewWillDismissScreen={this.props.onAdViewWillDismissScreen}
          onAdViewDidDismissScreen={this.props.onAdViewDidDismissScreen}
          onAdViewWillLeaveApplication={this.props.onAdViewWillLeaveApplication}
        />
      </View>
    );
  }
}

const ExpoBannerView = requireNativeViewManager('ExpoAdsAdMobBannerView');

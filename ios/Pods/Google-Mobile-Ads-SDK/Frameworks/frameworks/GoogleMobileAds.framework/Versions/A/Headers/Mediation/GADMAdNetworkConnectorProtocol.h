//
//  GADMAdNetworkConnectorProtocol.h
//  Google Mobile Ads SDK
//
//  Copyright 2011 Google. All rights reserved.
//

#import <GoogleMobileAds/GoogleMobileAds.h>
#import <UIKit/UIKit.h>

#import "GADMediationAdRequest.h"

@protocol GADMAdNetworkAdapter;

/// Ad network adapters interact with the mediation SDK using an object that implements the
/// GADMAdNetworkConnector protocol. The connector object can be used to obtain necessary
/// information for ad requests, and to call back to the mediation SDK on ad request returns and
/// user interactions.
@protocol GADMAdNetworkConnector<GADMediationAdRequest>

/// When you need to show a landing page or any other modal view, such as when a user clicks or when
/// your Ads SDK needs to show an interstitial, use this method to obtain a UIViewController that
/// you can use to show your modal view. Call the -presentViewController:animated:completion: method
/// of the returned UIViewController .
- (UIViewController *)viewControllerForPresentingModalView;

/// Returns the preferred ad volume as a fraction of system volume (0.0 to 1.0).
- (float)adVolume;

/// Returns whether the ad should be muted.
- (BOOL)adMuted;

#pragma mark - Adapter Callbacks

/// Tells the connector that the adapter failed to receive an ad.
- (void)adapter:(id<GADMAdNetworkAdapter>)adapter didFailAd:(NSError *)error;

/// Tells the connector that the adapter received a banner ad.
- (void)adapter:(id<GADMAdNetworkAdapter>)adapter didReceiveAdView:(UIView *)view;

/// Tells the connector that the adapter received an interstitial.
- (void)adapterDidReceiveInterstitial:(id<GADMAdNetworkAdapter>)adapter;

/// Tells the connector that the adapter has received a mediated native ad. |mediatedNativeAd| is
/// used by the Google Mobile Ads SDK for constructing a native ad object.
- (void)adapter:(id<GADMAdNetworkAdapter>)adapter
    didReceiveMediatedNativeAd:(id<GADMediatedNativeAd>)mediatedNativeAd;

#pragma mark Ad events

// Adapter should call as many of these as possible, during the lifecycle of the loaded banner or
// interstitial ad.

/// Tells the connector that the adapter recorded a user click.
- (void)adapterDidGetAdClick:(id<GADMAdNetworkAdapter>)adapter;
/// Tells the connector that the adapter will leave the application because of a user action.
- (void)adapterWillLeaveApplication:(id<GADMAdNetworkAdapter>)adapter;

// Adapter should call as many of these as possible, during the lifecycle of the loaded banner ad.

/// Tells the connector that the adapter will present a full screen modal.
- (void)adapterWillPresentFullScreenModal:(id<GADMAdNetworkAdapter>)adapter;
/// Tells the connector that the adapter will dismiss a full screen modal.
- (void)adapterWillDismissFullScreenModal:(id<GADMAdNetworkAdapter>)adapter;
/// Tells the connector that the adapter dismissed a full screen modal.
- (void)adapterDidDismissFullScreenModal:(id<GADMAdNetworkAdapter>)adapter;

// Adapter should call these methods during the lifecycle of the loaded interstitial ad.

/// Tells the connector that the adapter will present an interstitial.
- (void)adapterWillPresentInterstitial:(id<GADMAdNetworkAdapter>)adapter;
/// Tells the connector that the adapter will dismiss an interstitial.
- (void)adapterWillDismissInterstitial:(id<GADMAdNetworkAdapter>)adapter;
/// Tells the connector that the adapter did dismiss an interstitial.
- (void)adapterDidDismissInterstitial:(id<GADMAdNetworkAdapter>)adapter;

#pragma mark Deprecated

/// Deprecated. Use -adapterDidReceiveInterstitial:.
- (void)adapter:(id<GADMAdNetworkAdapter>)adapter
    didReceiveInterstitial:(NSObject *)interstitial
    GAD_DEPRECATED_MSG_ATTRIBUTE("Use -adapterDidReceiveInterstitial:.");

/// Deprecated. Use -adapterDidGetAdClick:.
- (void)adapter:(id<GADMAdNetworkAdapter>)adapter
    clickDidOccurInBanner:(UIView *)view
    GAD_DEPRECATED_MSG_ATTRIBUTE("Use -adapterDidGetAdClick:.");

/// Deprecated. Use -adapter:didFailAd:.
- (void)adapter:(id<GADMAdNetworkAdapter>)adapter
    didFailInterstitial:(NSError *)error GAD_DEPRECATED_MSG_ATTRIBUTE("Use -adapter:didFailAd:");

@end

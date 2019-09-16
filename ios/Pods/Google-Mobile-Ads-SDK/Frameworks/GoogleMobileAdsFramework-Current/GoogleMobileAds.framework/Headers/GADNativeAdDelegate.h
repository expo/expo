//
//  GADNativeAdDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADNativeAd;

NS_ASSUME_NONNULL_BEGIN

/// Identifies native ad assets.
@protocol GADNativeAdDelegate <NSObject>

@optional

#pragma mark Ad Lifecycle Events

/// Called when an impression is recorded for an ad. Only called for Google ads and is not supported
/// for mediation ads.
- (void)nativeAdDidRecordImpression:(GADNativeAd *)nativeAd;

/// Called when a click is recorded for an ad. Only called for Google ads and is not supported for
/// mediation ads.
- (void)nativeAdDidRecordClick:(GADNativeAd *)nativeAd;

#pragma mark Click-Time Lifecycle Notifications

/// Called just before presenting the user a full screen view, such as a browser, in response to
/// clicking on an ad. Use this opportunity to stop animations, time sensitive interactions, etc.
///
/// Normally the user looks at the ad, dismisses it, and control returns to your application with
/// the nativeAdDidDismissScreen: message. However, if the user hits the Home button or clicks on an
/// App Store link, your application will end. The next method called will be the
/// applicationWillResignActive: of your UIApplicationDelegate object.Immediately after that,
/// nativeAdWillLeaveApplication: is called.
- (void)nativeAdWillPresentScreen:(GADNativeAd *)nativeAd;

/// Called just before dismissing a full screen view.
- (void)nativeAdWillDismissScreen:(GADNativeAd *)nativeAd;

/// Called just after dismissing a full screen view. Use this opportunity to restart anything you
/// may have stopped as part of nativeAdWillPresentScreen:.
- (void)nativeAdDidDismissScreen:(GADNativeAd *)nativeAd;

/// Called just before the application will go to the background or terminate due to an ad action
/// that will launch another application (such as the App Store). The normal UIApplicationDelegate
/// methods, like applicationDidEnterBackground:, will be called immediately before this.
- (void)nativeAdWillLeaveApplication:(GADNativeAd *)nativeAd;

@end

NS_ASSUME_NONNULL_END

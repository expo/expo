//
//  GADMediationNativeAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADAdLoader.h>
#import <GoogleMobileAds/GADNativeAdImage.h>
#import <GoogleMobileAds/Mediation/GADMediatedUnifiedNativeAd.h>
#import <GoogleMobileAds/Mediation/GADMediationAd.h>
#import <GoogleMobileAds/Mediation/GADMediationAdConfiguration.h>
#import <GoogleMobileAds/Mediation/GADMediationAdEventDelegate.h>
#import <UIKit/UIKit.h>

/// Rendered native ad.
// TODO(burnse): Remove the dependency on GADMediatedUnifiedNativeAd by copying API to this protocol
// directly once legacy mediation APIs have been deprecated.
@protocol GADMediationNativeAd <GADMediationAd, GADMediatedUnifiedNativeAd>

@optional

/// Indicates whether the ad handles user clicks. If this method returns YES, the ad must handle
/// user clicks and notify the Google Mobile Ads SDK of clicks using
/// -[GADMediationAdEventDelegate reportClick:]. If this method returns NO, the Google Mobile Ads
/// SDK handles user clicks and notifies the ad of clicks using -[GADMediationNativeAd
/// didRecordClickOnAssetWithName:view:viewController:].
- (BOOL)handlesUserClicks;

/// Indicates whether the ad handles user impressions tracking. If this method returns YES, the
/// Google Mobile Ads SDK will not track user impressions and the ad must notify the
/// Google Mobile Ads SDK of impressions using -[GADMediationAdEventDelegate
/// reportImpression:]. If this method returns NO, the Google Mobile Ads SDK tracks user impressions
/// and notifies the ad of impressions using -[GADMediationNativeAd didRecordImpression:].
- (BOOL)handlesUserImpressions;
@end

@interface GADMediationNativeAdConfiguration : GADMediationAdConfiguration

/// Additional options configured by the publisher for requesting a native ad.
@property(nonatomic, readonly, nonnull) NSArray<GADAdLoaderOptions *> *options;

@end

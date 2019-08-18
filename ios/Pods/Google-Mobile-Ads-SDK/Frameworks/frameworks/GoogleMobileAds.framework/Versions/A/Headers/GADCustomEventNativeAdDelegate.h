//
//  GADCustomEventNativeAdDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GADCustomEventNativeAd.h>
#import <GoogleMobileAds/GADMediatedNativeAd.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// The delegate of the GADCustomEventNativeAd object must adopt the GADCustomEventNativeAdDelegate
/// protocol. Methods in this protocol are used for native ad's custom event communication with the
/// Google Mobile Ads SDK.
@protocol GADCustomEventNativeAdDelegate<NSObject>

/// Tells the delegate that the custom event ad request succeeded and loaded a native ad.
- (void)customEventNativeAd:(id<GADCustomEventNativeAd>)customEventNativeAd
    didReceiveMediatedNativeAd:(id<GADMediatedNativeAd>)mediatedNativeAd;

/// Tells the delegate that the custom event ad request failed.
- (void)customEventNativeAd:(id<GADCustomEventNativeAd>)customEventNativeAd
     didFailToLoadWithError:(NSError *)error;

@end

GAD_ASSUME_NONNULL_END

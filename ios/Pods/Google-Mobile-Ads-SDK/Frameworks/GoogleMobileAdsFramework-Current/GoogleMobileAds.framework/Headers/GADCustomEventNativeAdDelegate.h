//
//  GADCustomEventNativeAdDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADCustomEventNativeAd.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <GoogleMobileAds/Mediation/GADMediatedNativeAd.h>
#import <GoogleMobileAds/Mediation/GADMediatedUnifiedNativeAd.h>

/// The delegate of the GADCustomEventNativeAd object must adopt the GADCustomEventNativeAdDelegate
/// protocol. Methods in this protocol are used for native ad's custom event communication with the
/// Google Mobile Ads SDK.
@protocol GADCustomEventNativeAdDelegate <NSObject>

/// Tells the delegate that the custom event ad request succeeded and loaded a native ad.
- (void)customEventNativeAd:(nonnull id<GADCustomEventNativeAd>)customEventNativeAd
    didReceiveMediatedNativeAd:(nonnull id<GADMediatedNativeAd>)mediatedNativeAd;

/// Tells the delegate that the custom event ad request failed.
- (void)customEventNativeAd:(nonnull id<GADCustomEventNativeAd>)customEventNativeAd
     didFailToLoadWithError:(nonnull NSError *)error;

/// Tells the delegate that the custom event ad request succeeded and loaded a unified native ad.
- (void)customEventNativeAd:(nonnull id<GADCustomEventNativeAd>)customEventNativeAd
    didReceiveMediatedUnifiedNativeAd:
        (nonnull id<GADMediatedUnifiedNativeAd>)mediatedUnifiedNativeAd;

@end

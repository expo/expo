//
//  DFPCustomRenderedInterstitialDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2014 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class DFPCustomRenderedAd;
@class DFPInterstitial;

GAD_ASSUME_NONNULL_BEGIN

/// The DFPCustomRenderedAd interstitial delegate protocol for notifying the delegate of changes to
/// custom rendered interstitials.
@protocol DFPCustomRenderedInterstitialDelegate<NSObject>

/// Called after ad data has been received. You must construct an interstitial from
/// |customRenderedAd| and call the |customRenderedAd| object's finishedRenderingAdView: method when
/// the ad has been rendered.
- (void)interstitial:(DFPInterstitial *)interstitial
    didReceiveCustomRenderedAd:(DFPCustomRenderedAd *)customRenderedAd;

@end

GAD_ASSUME_NONNULL_END

//
//  DFPCustomRenderedBannerViewDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2014 Google Inc. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class DFPBannerView;
@class DFPCustomRenderedAd;

GAD_ASSUME_NONNULL_BEGIN

/// The DFPCustomRenderedAd banner view delegate protocol for notifying the delegate of changes to
/// custom rendered banners.
@protocol DFPCustomRenderedBannerViewDelegate<NSObject>

/// Called after ad data has been received. You must construct a banner from |customRenderedAd| and
/// call the |customRenderedAd| object's finishedRenderingAdView: when the ad has been rendered.
- (void)bannerView:(DFPBannerView *)bannerView
    didReceiveCustomRenderedAd:(DFPCustomRenderedAd *)customRenderedAd;

@end

GAD_ASSUME_NONNULL_END

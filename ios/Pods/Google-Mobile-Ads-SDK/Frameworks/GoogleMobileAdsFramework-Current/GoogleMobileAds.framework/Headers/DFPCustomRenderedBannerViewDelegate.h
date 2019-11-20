//
//  DFPCustomRenderedBannerViewDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2014 Google LLC. All rights reserved.
//

#import <UIKit/UIKit.h>

@class DFPBannerView;
@class DFPCustomRenderedAd;

/// The DFPCustomRenderedAd banner view delegate protocol for notifying the delegate of changes to
/// custom rendered banners.
@protocol DFPCustomRenderedBannerViewDelegate <NSObject>

/// Called after ad data has been received. You must construct a banner from |customRenderedAd| and
/// call the |customRenderedAd| object's finishedRenderingAdView: when the ad has been rendered.
- (void)bannerView:(nonnull DFPBannerView *)bannerView
    didReceiveCustomRenderedAd:(nonnull DFPCustomRenderedAd *)customRenderedAd;

@end

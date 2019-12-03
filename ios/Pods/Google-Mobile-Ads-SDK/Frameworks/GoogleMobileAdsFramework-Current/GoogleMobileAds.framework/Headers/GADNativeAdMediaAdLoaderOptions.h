//
//  GADNativeAdMediaAdLoaderOptions.h
//  Google Mobile Ads SDK
//
//  Copyright 2019 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADAdLoader.h>
#import <GoogleMobileAds/GADMediaAspectRatio.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// Ad loader options for native ad media settings.
@interface GADNativeAdMediaAdLoaderOptions : GADAdLoaderOptions

/// Image and video aspect ratios. Defaults to GADMediaAspectRatioUnknown. Portrait, landscape, and
/// square aspect ratios are returned when this property is GADMediaAspectRatioUnknown or
/// GADMediaAspectRatioAny.
@property(nonatomic, assign) GADMediaAspectRatio mediaAspectRatio;

@end

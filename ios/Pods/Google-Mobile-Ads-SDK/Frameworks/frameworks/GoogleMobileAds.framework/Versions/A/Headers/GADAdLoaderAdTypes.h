//
//  GADAdLoaderAdTypes.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

typedef NSString *GADAdLoaderAdType GAD_STRING_ENUM;

/// Use with GADAdLoader to request native app install ads. To receive ads, the ad loader's delegate
/// must conform to the GADNativeAppInstallAdLoaderDelegate protocol. See GADNativeAppInstallAd.h.
///
/// See GADNativeAdImageAdLoaderOptions.h for ad loader image options.
GAD_EXTERN GADAdLoaderAdType const kGADAdLoaderAdTypeNativeAppInstall;

/// Use with GADAdLoader to request native content ads. To receive ads, the ad loader's delegate
/// must conform to the GADNativeContentAdLoaderDelegate protocol. See GADNativeContentAd.h.
///
/// See GADNativeAdImageAdLoaderOptions.h for ad loader image options.
GAD_EXTERN GADAdLoaderAdType const kGADAdLoaderAdTypeNativeContent;

/// Use with GADAdLoader to request native custom template ads. To receive ads, the ad loader's
/// delegate must conform to the GADNativeCustomTemplateAdLoaderDelegate protocol. See
/// GADNativeCustomTemplateAd.h.
GAD_EXTERN GADAdLoaderAdType const kGADAdLoaderAdTypeNativeCustomTemplate;

/// Use with GADAdLoader to request DFP banner ads. To receive ads, the ad loader's delegate must
/// conform to the DFPBannerAdLoaderDelegate protocol. See DFPBannerView.h.
GAD_EXTERN GADAdLoaderAdType const kGADAdLoaderAdTypeDFPBanner;

GAD_ASSUME_NONNULL_END

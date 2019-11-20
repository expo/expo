//
//  GADAdLoaderAdTypes.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

typedef NSString *GADAdLoaderAdType NS_STRING_ENUM;

/// Use with GADAdLoader to request native custom template ads. To receive ads, the ad loader's
/// delegate must conform to the GADNativeCustomTemplateAdLoaderDelegate protocol. See
/// GADNativeCustomTemplateAd.h.
GAD_EXTERN GADAdLoaderAdType _Nonnull const kGADAdLoaderAdTypeNativeCustomTemplate;

/// Use with GADAdLoader to request Google Ad Manager banner ads. To receive ads, the ad loader's
/// delegate must conform to the DFPBannerAdLoaderDelegate protocol. See DFPBannerView.h.
GAD_EXTERN GADAdLoaderAdType _Nonnull const kGADAdLoaderAdTypeDFPBanner;

/// Use with GADAdLoader to request native ads. To receive ads, the ad loader's delegate must
/// conform to the GADUnifiedNativeAdLoaderDelegate protocol. See GADUnifiedNativeAd.h.
GAD_EXTERN GADAdLoaderAdType _Nonnull const kGADAdLoaderAdTypeUnifiedNative;

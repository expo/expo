//
//  GoogleMobileAds.h
//  Google Mobile Ads SDK
//
//  Copyright 2014 Google Inc. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_6_0
#error The Google Mobile Ads SDK requires a deployment target of iOS 6.0 or later.
#endif

#if defined(__ARM_ARCH_7S__) && __ARM_ARCH_7S__
#error The Google Mobile Ads SDK doesn't support linking with armv7s. Remove armv7s from "ARCHS" (Architectures) in your Build Settings.
#endif

/// Project version string for GoogleMobileAds.
FOUNDATION_EXPORT const unsigned char GoogleMobileAdsVersionString[];

// Header files.
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

#import <GoogleMobileAds/GADAdDelegate.h>
#import <GoogleMobileAds/GADAdNetworkExtras.h>
#import <GoogleMobileAds/GADAdSize.h>
#import <GoogleMobileAds/GADAudioVideoManagerDelegate.h>
#import <GoogleMobileAds/GADAudioVideoManager.h>
#import <GoogleMobileAds/GADBannerView.h>
#import <GoogleMobileAds/GADBannerViewDelegate.h>
#import <GoogleMobileAds/GADCorrelator.h>
#import <GoogleMobileAds/GADCorrelatorAdLoaderOptions.h>
#import <GoogleMobileAds/GADDebugOptionsViewController.h>
#import <GoogleMobileAds/GADExtras.h>
#import <GoogleMobileAds/GADInAppPurchase.h>
#import <GoogleMobileAds/GADInAppPurchaseDelegate.h>
#import <GoogleMobileAds/GADInterstitial.h>
#import <GoogleMobileAds/GADInterstitialDelegate.h>
#import <GoogleMobileAds/GADMediaView.h>
#import <GoogleMobileAds/GADMobileAds.h>
#import <GoogleMobileAds/GADNativeExpressAdView.h>
#import <GoogleMobileAds/GADNativeExpressAdViewDelegate.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GADRequestError.h>
#import <GoogleMobileAds/GADVideoController.h>
#import <GoogleMobileAds/GADVideoControllerDelegate.h>
#import <GoogleMobileAds/GADVideoOptions.h>

#import <GoogleMobileAds/DFPBannerView.h>
#import <GoogleMobileAds/DFPBannerViewOptions.h>
#import <GoogleMobileAds/DFPCustomRenderedAd.h>
#import <GoogleMobileAds/DFPCustomRenderedBannerViewDelegate.h>
#import <GoogleMobileAds/DFPCustomRenderedInterstitialDelegate.h>
#import <GoogleMobileAds/DFPInterstitial.h>
#import <GoogleMobileAds/DFPRequest.h>
#import <GoogleMobileAds/GADAdSizeDelegate.h>
#import <GoogleMobileAds/GADAppEventDelegate.h>

#import <GoogleMobileAds/GADAdLoader.h>
#import <GoogleMobileAds/GADAdLoaderAdTypes.h>
#import <GoogleMobileAds/GADAdLoaderDelegate.h>

#import <GoogleMobileAds/GADAdChoicesView.h>
#import <GoogleMobileAds/GADNativeAd.h>
#import <GoogleMobileAds/GADNativeAdDelegate.h>
#import <GoogleMobileAds/GADNativeAdImage.h>
#import <GoogleMobileAds/GADNativeAdImage+Mediation.h>
#import <GoogleMobileAds/GADNativeAppInstallAd.h>
#import <GoogleMobileAds/GADNativeAppInstallAdAssetIDs.h>
#import <GoogleMobileAds/GADNativeContentAd.h>
#import <GoogleMobileAds/GADNativeContentAdAssetIDs.h>
#import <GoogleMobileAds/GADNativeCustomTemplateAd.h>

#import <GoogleMobileAds/GADNativeAdImageAdLoaderOptions.h>
#import <GoogleMobileAds/GADNativeAdViewAdOptions.h>

#import <GoogleMobileAds/GADCustomEventBanner.h>
#import <GoogleMobileAds/GADCustomEventBannerDelegate.h>
#import <GoogleMobileAds/GADCustomEventExtras.h>
#import <GoogleMobileAds/GADCustomEventInterstitial.h>
#import <GoogleMobileAds/GADCustomEventInterstitialDelegate.h>
#import <GoogleMobileAds/GADCustomEventNativeAd.h>
#import <GoogleMobileAds/GADCustomEventNativeAdDelegate.h>
#import <GoogleMobileAds/GADCustomEventParameters.h>
#import <GoogleMobileAds/GADCustomEventRequest.h>
#import <GoogleMobileAds/GADMediatedNativeAd.h>
#import <GoogleMobileAds/GADMediatedNativeAdDelegate.h>
#import <GoogleMobileAds/GADMediatedNativeAdNotificationSource.h>
#import <GoogleMobileAds/GADMediatedNativeAppInstallAd.h>
#import <GoogleMobileAds/GADMediatedNativeContentAd.h>

#import <GoogleMobileAds/GADDynamicHeightSearchRequest.h>
#import <GoogleMobileAds/GADSearchBannerView.h>
#import <GoogleMobileAds/GADSearchRequest.h>

#import <GoogleMobileAds/GADAdReward.h>
#import <GoogleMobileAds/GADRewardBasedVideoAd.h>
#import <GoogleMobileAds/GADRewardBasedVideoAdDelegate.h>

#import <GoogleMobileAds/Mediation/GADMAdNetworkAdapterProtocol.h>
#import <GoogleMobileAds/Mediation/GADMAdNetworkConnectorProtocol.h>
#import <GoogleMobileAds/Mediation/GADMediationAdRequest.h>
#import <GoogleMobileAds/Mediation/GADMEnums.h>
#import <GoogleMobileAds/Mediation/GADMRewardBasedVideoAdNetworkAdapterProtocol.h>
#import <GoogleMobileAds/Mediation/GADMRewardBasedVideoAdNetworkConnectorProtocol.h>

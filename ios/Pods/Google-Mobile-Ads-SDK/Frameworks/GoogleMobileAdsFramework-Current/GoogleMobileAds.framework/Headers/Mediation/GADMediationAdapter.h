//
//  GADMediationAdapter.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <GoogleMobileAds/Mediation/GADMediationAdEventDelegate.h>
#import <GoogleMobileAds/Mediation/GADMediationBannerAd.h>
#import <GoogleMobileAds/Mediation/GADMediationInterstitialAd.h>
#import <GoogleMobileAds/Mediation/GADMediationNativeAd.h>
#import <GoogleMobileAds/Mediation/GADMediationRewardedAd.h>
#import <GoogleMobileAds/Mediation/GADMediationServerConfiguration.h>
#import <GoogleMobileAds/Mediation/GADVersionNumber.h>

/// Called by the adapter after loading the banner ad or encountering an error. Returns an ad
/// event object to send ad events to the Google Mobile Ads SDK. The block returns nil if a delegate
/// couldn't be created or if the block has already been called.
typedef id<GADMediationBannerAdEventDelegate> _Nullable (^GADMediationBannerLoadCompletionHandler)(
    _Nullable id<GADMediationBannerAd> ad, NSError *_Nullable error);

/// Called by the adapter after loading the interstitial ad or encountering an error. Returns an
/// ad event delegate to send ad events to the Google Mobile Ads SDK. The block returns nil if a
/// delegate couldn't be created or if the block has already been called.
typedef id<GADMediationInterstitialAdEventDelegate> _Nullable (
    ^GADMediationInterstitialLoadCompletionHandler)(_Nullable id<GADMediationInterstitialAd> ad,
                                                    NSError *_Nullable error);

/// Called by the adapter after loading the native ad or encountering an error. Returns an ad
/// event delegate to send ad events to the Google Mobile Ads SDK. The block returns nil if a
/// delegate couldn't be created or if the block has already been called.
typedef id<GADMediationNativeAdEventDelegate> _Nullable (^GADMediationNativeLoadCompletionHandler)(
    _Nullable id<GADMediationNativeAd> ad, NSError *_Nullable error);

/// Called by the adapter after loading the rewarded ad or encountering an error. Returns an ad
/// event delegate to send ad events to the Google Mobile Ads SDK. The block returns nil if a
/// delegate couldn't be created or if the block has already been called.
typedef id<GADMediationRewardedAdEventDelegate> _Nullable (
    ^GADMediationRewardedLoadCompletionHandler)(_Nullable id<GADMediationRewardedAd> ad,
                                                NSError *_Nullable error);

/// Executes when adapter set up completes.
typedef void (^GADMediationAdapterSetUpCompletionBlock)(NSError *_Nullable error);

@protocol GADAdNetworkExtras;

/// Receives messages and requests from the Google Mobile Ads SDK. Provides GMA to 3P SDK
/// communication.
///
/// Adapters are initialized on a background queue and should avoid using the main queue until
/// load time.
@protocol GADMediationAdapter <NSObject>
/// Returns the adapter version.
+ (GADVersionNumber)version;

/// Returns the ad SDK version.
+ (GADVersionNumber)adSDKVersion;

/// The extras class that is used to specify additional parameters for a request to this ad network.
/// Returns Nil if the network doesn't have publisher provided extras.
+ (nullable Class<GADAdNetworkExtras>)networkExtrasClass;

@optional

/// Tells the adapter to set up its underlying ad network SDK and perform any necessary prefetching
/// or configuration work. The adapter must call completionHandler once the adapter can service ad
/// requests, or if it encounters an error while setting up.
+ (void)setUpWithConfiguration:(nonnull GADMediationServerConfiguration *)configuration
             completionHandler:(nonnull GADMediationAdapterSetUpCompletionBlock)completionHandler;

/// Asks the adapter to load a banner ad with the provided ad configuration. The adapter must call
/// back completionHandler with the loaded ad, or it may call back with an error. This method is
/// called on the main thread, and completionHandler must be called back on the main thread.
- (void)loadBannerForAdConfiguration:(nonnull GADMediationBannerAdConfiguration *)adConfiguration
                   completionHandler:
                       (nonnull GADMediationBannerLoadCompletionHandler)completionHandler;

/// Asks the adapter to load an interstitial ad with the provided ad configuration. The adapter
/// must call back completionHandler with the loaded ad, or it may call back with an error. This
/// method is called on the main thread, and completionHandler must be called back on the main
/// thread.
- (void)loadInterstitialForAdConfiguration:
            (nonnull GADMediationInterstitialAdConfiguration *)adConfiguration
                         completionHandler:(nonnull GADMediationInterstitialLoadCompletionHandler)
                                               completionHandler;

/// Asks the adapter to load a native ad with the provided ad configuration. The adapter must call
/// back completionHandler with the loaded ad, or it may call back with an error. This method is
/// called on the main thread, and completionHandler must be called back on the main thread.
- (void)loadNativeAdForAdConfiguration:(nonnull GADMediationNativeAdConfiguration *)adConfiguration
                     completionHandler:
                         (nonnull GADMediationNativeLoadCompletionHandler)completionHandler;

/// Asks the adapter to load a rewarded ad with the provided ad configuration. The adapter must
/// call back completionHandler with the loaded ad, or it may call back with an error. This method
/// is called on the main thread, and completionHandler must be called back on the main thread.
- (void)loadRewardedAdForAdConfiguration:
            (nonnull GADMediationRewardedAdConfiguration *)adConfiguration
                       completionHandler:
                           (nonnull GADMediationRewardedLoadCompletionHandler)completionHandler;

@end

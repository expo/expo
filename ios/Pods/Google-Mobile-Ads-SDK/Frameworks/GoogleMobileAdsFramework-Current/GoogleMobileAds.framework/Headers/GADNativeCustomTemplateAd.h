//
//  GADNativeCustomTemplateAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADAdLoaderDelegate.h>
#import <GoogleMobileAds/GADDisplayAdMeasurement.h>
#import <GoogleMobileAds/GADMediaView.h>
#import <GoogleMobileAds/GADNativeAd.h>
#import <GoogleMobileAds/GADNativeAdImage.h>
#import <GoogleMobileAds/GADVideoController.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// Native ad custom click handler block. |assetID| is the ID of asset that has received a click.
typedef void (^GADNativeAdCustomClickHandler)(NSString *assetID);

/// Asset key for the GADMediaView asset view.
GAD_EXTERN NSString *const GADNativeCustomTemplateAdMediaViewKey;

/// Native custom template ad. To request this ad type, you need to pass
/// kGADAdLoaderAdTypeNativeCustomTemplate (see GADAdLoaderAdTypes.h) to the |adTypes| parameter
/// in GADAdLoader's initializer method. If you request this ad type, your delegate must conform to
/// the GADNativeCustomTemplateAdLoaderDelegate protocol.
@interface GADNativeCustomTemplateAd : GADNativeAd

/// The ad's custom template ID.
@property(nonatomic, readonly) NSString *templateID;

/// Array of available asset keys.
@property(nonatomic, readonly) NSArray<NSString *> *availableAssetKeys;

/// Returns video controller for controlling receiver's video.
@property(nonatomic, readonly, strong) GADVideoController *videoController;

/// Returns media view for rendering video loaded by the receiver. Returns nil if receiver doesn't
/// has a video.
@property(nonatomic, readonly, strong, nullable) GADMediaView *mediaView;

/// Custom click handler. Set this property only if this template ad is configured with a custom
/// click action, otherwise set it to nil. If this property is set to a non-nil value, the ad's
/// built-in click actions are ignored and |customClickHandler| is executed when a click on the
/// asset is received.
@property(atomic, copy, nullable) GADNativeAdCustomClickHandler customClickHandler;

/// The display ad measurement associated with this ad.
@property(nonatomic, readonly, nullable) GADDisplayAdMeasurement *displayAdMeasurement;

/// Returns the native ad image corresponding to the specified key or nil if the image is not
/// available.
- (nullable GADNativeAdImage *)imageForKey:(NSString *)key;

/// Returns the string corresponding to the specified key or nil if the string is not available.
- (nullable NSString *)stringForKey:(NSString *)key;

/// Call when the user clicks on the ad. Provide the asset key that best matches the asset the user
/// interacted with. If this ad is configured with a custom click action, ensure the receiver's
/// customClickHandler property is set before calling this method.
- (void)performClickOnAssetWithKey:(NSString *)assetKey;

/// Call when the ad is displayed on screen to the user. Can be called multiple times. Only the
/// first impression is recorded.
- (void)recordImpression;

/// Call when the user clicks on the ad. Provide the asset key that best matches the asset the user
/// interacted with. Provide |customClickHandler| only if this template is configured with a custom
/// click action, otherwise pass in nil. If a block is provided, the ad's built-in click actions are
/// ignored and |customClickHandler| is executed after recording the click.
///
/// This method is deprecated. See performClickOnAssetWithKey: API.
- (void)performClickOnAssetWithKey:(NSString *)assetKey
                customClickHandler:(nullable dispatch_block_t)customClickHandler
    GAD_DEPRECATED_MSG_ATTRIBUTE("Use performClickOnAssetWithKey:.");

@end

#pragma mark - Loading Protocol

/// The delegate of a GADAdLoader object implements this protocol to receive
/// GADNativeCustomTemplateAd ads.
@protocol GADNativeCustomTemplateAdLoaderDelegate <GADAdLoaderDelegate>

/// Called when requesting an ad. Asks the delegate for an array of custom template ID strings.
- (NSArray<NSString *> *)nativeCustomTemplateIDsForAdLoader:(GADAdLoader *)adLoader;

/// Tells the delegate that a native custom template ad was received.
- (void)adLoader:(GADAdLoader *)adLoader
    didReceiveNativeCustomTemplateAd:(GADNativeCustomTemplateAd *)nativeCustomTemplateAd;

@end

NS_ASSUME_NONNULL_END

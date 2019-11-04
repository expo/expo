//
//  GADUnifiedNativeAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2017 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADAdChoicesView.h>
#import <GoogleMobileAds/GADAdLoaderDelegate.h>
#import <GoogleMobileAds/GADMediaContent.h>
#import <GoogleMobileAds/GADMediaView.h>
#import <GoogleMobileAds/GADMuteThisAdReason.h>
#import <GoogleMobileAds/GADNativeAdImage.h>
#import <GoogleMobileAds/GADResponseInfo.h>
#import <GoogleMobileAds/GADUnifiedNativeAdAssetIdentifiers.h>
#import <GoogleMobileAds/GADUnifiedNativeAdDelegate.h>
#import <GoogleMobileAds/GADVideoController.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <UIKit/UIKit.h>

/// Unified native ad. To request this ad type, pass kGADAdLoaderAdTypeUnifiedNative
/// (see GADAdLoaderAdTypes.h) to the |adTypes| parameter in GADAdLoader's initializer method. If
/// you request this ad type, your delegate must conform to the GADUnifiedNativeAdLoaderDelegate
/// protocol.
@interface GADUnifiedNativeAd : NSObject

#pragma mark - Must be displayed if available

/// Headline
@property(nonatomic, readonly, copy, nullable) NSString *headline;

#pragma mark - Recommended to display

/// Text that encourages user to take some action with the ad. For example "Install".
@property(nonatomic, readonly, copy, nullable) NSString *callToAction;
/// Icon image.
@property(nonatomic, readonly, strong, nullable) GADNativeAdImage *icon;
/// Description.
@property(nonatomic, readonly, copy, nullable) NSString *body;
/// Array of GADNativeAdImage objects.
@property(nonatomic, readonly, strong, nullable) NSArray<GADNativeAdImage *> *images;
/// App store rating (0 to 5).
@property(nonatomic, readonly, copy, nullable) NSDecimalNumber *starRating;
/// The app store name. For example, "App Store".
@property(nonatomic, readonly, copy, nullable) NSString *store;
/// String representation of the app's price.
@property(nonatomic, readonly, copy, nullable) NSString *price;
/// Identifies the advertiser. For example, the advertiser’s name or visible URL.
@property(nonatomic, readonly, copy, nullable) NSString *advertiser;

/// Optional delegate to receive state change notifications.
@property(nonatomic, weak, nullable) id<GADUnifiedNativeAdDelegate> delegate;

/// Reference to a root view controller that is used by the ad to present full screen content after
/// the user interacts with the ad. The root view controller is most commonly the view controller
/// displaying the ad.
@property(nonatomic, weak, nullable) UIViewController *rootViewController;

/// Dictionary of assets which aren't processed by the receiver.
@property(nonatomic, readonly, copy, nullable) NSDictionary<NSString *, id> *extraAssets;

/// Information about the ad response that returned the ad.
@property(nonatomic, readonly, nonnull) GADResponseInfo *responseInfo;

/// Indicates whether custom Mute This Ad is available for the native ad.
@property(nonatomic, readonly, getter=isCustomMuteThisAdAvailable) BOOL customMuteThisAdAvailable;

/// An array of Mute This Ad reasons used to render customized mute ad survey. Use this array to
/// implement your own Mute This Ad feature only when customMuteThisAdAvailable is YES.
@property(nonatomic, readonly, nullable) NSArray<GADMuteThisAdReason *> *muteThisAdReasons;

/// Media content. Set the associated media view's mediaContent property to this object to display
/// this content.
@property(nonatomic, readonly, nonnull) GADMediaContent *mediaContent;

/// Registers ad view, clickable asset views, and nonclickable asset views with this native ad.
/// Media view shouldn't be registered as clickable.
/// @param clickableAssetViews Dictionary of asset views that are clickable, keyed by asset IDs.
/// @param nonclickableAssetViews Dictionary of asset views that are not clickable, keyed by asset
///        IDs.
- (void)registerAdView:(nonnull UIView *)adView
       clickableAssetViews:
           (nonnull NSDictionary<GADUnifiedNativeAssetIdentifier, UIView *> *)clickableAssetViews
    nonclickableAssetViews:
        (nonnull NSDictionary<GADUnifiedNativeAssetIdentifier, UIView *> *)nonclickableAssetViews;

/// Unregisters ad view from this native ad. The corresponding asset views will also be
/// unregistered.
- (void)unregisterAdView;

/// Reports the mute event with the mute reason selected by user. Use nil if no reason was selected.
/// Call this method only if customMuteThisAdAvailable is YES.
- (void)muteThisAdWithReason:(nullable GADMuteThisAdReason *)reason;

#pragma mark - Deprecated

/// Video controller for controlling video playback in GADUnifiedNativeAdView's mediaView.
@property(nonatomic, readonly, nullable)
    GADVideoController *videoController GAD_DEPRECATED_MSG_ATTRIBUTE(
        "Use the videoController property from the ad's mediaContent instead.");

/// The ad network class name that fetched the current ad. For both standard and mediated Google
/// AdMob ads, this method returns @"GADMAdapterGoogleAdMobAds". For ads fetched via mediation
/// custom events, this method returns @"GADMAdapterCustomEvents".
@property(nonatomic, readonly, copy, nullable)
    NSString *adNetworkClassName GAD_DEPRECATED_MSG_ATTRIBUTE(
        "Use responseInfo.adNetworkClassName.");

@end

#pragma mark - Protocol and constants

/// The delegate of a GADAdLoader object implements this protocol to receive GADUnifiedNativeAd ads.
@protocol GADUnifiedNativeAdLoaderDelegate <GADAdLoaderDelegate>
/// Called when a unified native ad is received.
- (void)adLoader:(nonnull GADAdLoader *)adLoader
    didReceiveUnifiedNativeAd:(nonnull GADUnifiedNativeAd *)nativeAd;
@end

#pragma mark - Unified Native Ad View

/// Base class for native ad views. Your native ad view must be a subclass of this class and must
/// call superclass methods for all overridden methods.
@interface GADUnifiedNativeAdView : UIView

/// This property must point to the unified native ad object rendered by this ad view.
@property(nonatomic, strong, nullable) GADUnifiedNativeAd *nativeAd;

/// Weak reference to your ad view's headline asset view.
@property(nonatomic, weak, nullable) IBOutlet UIView *headlineView;
/// Weak reference to your ad view's call to action asset view.
@property(nonatomic, weak, nullable) IBOutlet UIView *callToActionView;
/// Weak reference to your ad view's icon asset view.
@property(nonatomic, weak, nullable) IBOutlet UIView *iconView;
/// Weak reference to your ad view's body asset view.
@property(nonatomic, weak, nullable) IBOutlet UIView *bodyView;
/// Weak reference to your ad view's store asset view.
@property(nonatomic, weak, nullable) IBOutlet UIView *storeView;
/// Weak reference to your ad view's price asset view.
@property(nonatomic, weak, nullable) IBOutlet UIView *priceView;
/// Weak reference to your ad view's image asset view.
@property(nonatomic, weak, nullable) IBOutlet UIView *imageView;
/// Weak reference to your ad view's star rating asset view.
@property(nonatomic, weak, nullable) IBOutlet UIView *starRatingView;
/// Weak reference to your ad view's advertiser asset view.
@property(nonatomic, weak, nullable) IBOutlet UIView *advertiserView;
/// Weak reference to your ad view's media asset view.
@property(nonatomic, weak, nullable) IBOutlet GADMediaView *mediaView;
/// Weak reference to your ad view's AdChoices view. Must set adChoicesView before setting
/// nativeAd, otherwise AdChoices will be rendered according to the preferredAdChoicesPosition
/// defined in GADNativeAdViewAdOptions.
@property(nonatomic, weak, nullable) IBOutlet GADAdChoicesView *adChoicesView;

@end

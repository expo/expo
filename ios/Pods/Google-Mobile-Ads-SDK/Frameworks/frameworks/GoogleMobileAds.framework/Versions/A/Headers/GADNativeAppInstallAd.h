//
//  GADNativeAppInstallAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADAdChoicesView.h>
#import <GoogleMobileAds/GADAdLoaderDelegate.h>
#import <GoogleMobileAds/GADMediaView.h>
#import <GoogleMobileAds/GADNativeAd.h>
#import <GoogleMobileAds/GADNativeAdImage.h>
#import <GoogleMobileAds/GADVideoController.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Native app install ad. To request this ad type, you need to pass
/// kGADAdLoaderAdTypeNativeAppInstall (see GADAdLoaderAdTypes.h) to the |adTypes| parameter in
/// GADAdLoader's initializer method. If you request this ad type, your delegate must conform to the
/// GADNativeAppInstallAdLoaderDelegate protocol.
@interface GADNativeAppInstallAd : GADNativeAd

#pragma mark - Must be displayed

/// App title.
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *headline;
/// Text that encourages user to take some action with the ad. For example "Install".
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *callToAction;
/// Application icon.
@property(nonatomic, readonly, strong, GAD_NULLABLE) GADNativeAdImage *icon;

#pragma mark - Recommended to display

/// App description.
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *body;
/// The app store name. For example, "App Store".
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *store;
/// String representation of the app's price.
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *price;
/// Array of GADNativeAdImage objects related to the advertised application.
@property(nonatomic, readonly, strong, GAD_NULLABLE) NSArray *images;
/// App store rating (0 to 5).
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSDecimalNumber *starRating;
/// Video controller for controlling video playback in GADNativeAppInstallAdView's mediaView.
@property(nonatomic, strong, readonly) GADVideoController *videoController;

/// Registers ad view and asset views created from this native ad.
/// @param assetViews Dictionary of asset views keyed by asset IDs.
- (void)registerAdView:(UIView *)adView assetViews:(NSDictionary<NSString *, UIView *> *)assetViews;

/// Unregisters ad view from this native ad. The corresponding asset views will also be
/// unregistered.
- (void)unregisterAdView;

@end

#pragma mark - Protocol and constants

/// The delegate of a GADAdLoader object implements this protocol to receive GADNativeAppInstallAd
/// ads.
@protocol GADNativeAppInstallAdLoaderDelegate<GADAdLoaderDelegate>
/// Called when a native app install ad is received.
- (void)adLoader:(GADAdLoader *)adLoader
    didReceiveNativeAppInstallAd:(GADNativeAppInstallAd *)nativeAppInstallAd;
@end

#pragma mark - Native App Install Ad View

/// Base class for app install ad views. Your app install ad view must be a subclass of this class
/// and must call superclass methods for all overriden methods.
@interface GADNativeAppInstallAdView : UIView

/// This property must point to the native app install ad object rendered by this ad view.
@property(nonatomic, strong, GAD_NULLABLE) GADNativeAppInstallAd *nativeAppInstallAd;

/// Weak reference to your ad view's headline asset view.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet UIView *headlineView;
/// Weak reference to your ad view's call to action asset view.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet UIView *callToActionView;
/// Weak reference to your ad view's icon asset view.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet UIView *iconView;
/// Weak reference to your ad view's body asset view.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet UIView *bodyView;
/// Weak reference to your ad view's store asset view.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet UIView *storeView;
/// Weak reference to your ad view's price asset view.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet UIView *priceView;
/// Weak reference to your ad view's image asset view.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet UIView *imageView;
/// Weak reference to your ad view's star rating asset view.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet UIView *starRatingView;
/// Weak reference to your ad view's media asset view.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet GADMediaView *mediaView;
/// Weak reference to your ad view's AdChoices view. Must set adChoicesView before setting
/// nativeAppInstallAd, otherwise AdChoices will be rendered in the publisher's
/// preferredAdChoicesPosition as defined in GADNativeAdViewAdOptions.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet GADAdChoicesView *adChoicesView;

@end

GAD_ASSUME_NONNULL_END

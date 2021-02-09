//
//  GADMediatedUnifiedNativeAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2017 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADNativeAdImage.h>
#import <GoogleMobileAds/GADUnifiedNativeAdAssetIdentifiers.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// Provides methods used for constructing native ads. The adapter must return an object conforming
/// to this protocol for native ad requests.
@protocol GADMediatedUnifiedNativeAd <NSObject>

/// Headline.
@property(nonatomic, readonly, copy, nullable) NSString *headline;

/// Array of GADNativeAdImage objects.
@property(nonatomic, readonly, nullable) NSArray<GADNativeAdImage *> *images;

/// Description.
@property(nonatomic, readonly, copy, nullable) NSString *body;

/// Icon image.
@property(nonatomic, readonly, nullable) GADNativeAdImage *icon;

/// Text that encourages user to take some action with the ad. For example "Install".
@property(nonatomic, readonly, copy, nullable) NSString *callToAction;

/// App store rating (0 to 5).
@property(nonatomic, readonly, copy, nullable) NSDecimalNumber *starRating;

/// The app store name. For example, "App Store".
@property(nonatomic, readonly, copy, nullable) NSString *store;

/// String representation of the app's price.
@property(nonatomic, readonly, copy, nullable) NSString *price;

/// Identifies the advertiser. For example, the advertiser’s name or visible URL.
@property(nonatomic, readonly, copy, nullable) NSString *advertiser;

/// Returns a dictionary of asset names and object pairs for assets that are not handled by
/// properties of the GADMediatedUnifiedNativeAd.
@property(nonatomic, readonly, copy, nullable) NSDictionary<NSString *, id> *extraAssets;

@optional

/// AdChoices view.
@property(nonatomic, readonly, nullable) UIView *adChoicesView;

/// Media view.
@property(nonatomic, readonly, nullable) UIView *mediaView;

/// Indicates whether the ad has video content.
@property(nonatomic, readonly) BOOL hasVideoContent;

/// Media content aspect ratio (width/height) or 0 if there's no media content.
@property(nonatomic, readonly) CGFloat mediaContentAspectRatio;

/// The video's duration in seconds or 0 if there's no video or the duration is unknown.
@property(nonatomic, readonly) NSTimeInterval duration;

/// The video's current playback time in seconds or 0 if there's no video or the current playback
/// time is unknown.
@property(nonatomic, readonly) NSTimeInterval currentTime;

/// Tells the receiver that it has been rendered in |view| with clickable asset views and
/// nonclickable asset views. viewController should be used to present modal views for the ad.
- (void)didRenderInView:(nonnull UIView *)view
       clickableAssetViews:
           (nonnull NSDictionary<GADUnifiedNativeAssetIdentifier, UIView *> *)clickableAssetViews
    nonclickableAssetViews:
        (nonnull NSDictionary<GADUnifiedNativeAssetIdentifier, UIView *> *)nonclickableAssetViews
            viewController:(nonnull UIViewController *)viewController;

/// Tells the receiver that an impression is recorded. This method is called only once per mediated
/// native ad.
- (void)didRecordImpression;

/// Tells the receiver that a user click is recorded on the asset named |assetName|. Full screen
/// actions should be presented from viewController. This method is called only if
/// -[GADMAdNetworkAdapter handlesUserClicks] returns NO.
- (void)didRecordClickOnAssetWithName:(nonnull GADUnifiedNativeAssetIdentifier)assetName
                                 view:(nonnull UIView *)view
                       viewController:(nonnull UIViewController *)viewController;

/// Tells the receiver that it has untracked |view|. This method is called when the mediated native
/// ad is no longer rendered in the provided view and the delegate should stop tracking the view's
/// impressions and clicks. The method may also be called with a nil view when the view in which the
/// mediated native ad has rendered is deallocated.
- (void)didUntrackView:(nullable UIView *)view;

@end

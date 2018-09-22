//
//  GADInterstitial.h
//  Google Mobile Ads SDK
//
//  Copyright 2011 Google Inc. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADInAppPurchaseDelegate.h>
#import <GoogleMobileAds/GADInterstitialDelegate.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GADRequestError.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// An interstitial ad. This is a full-screen advertisement shown at natural transition points in
/// your application such as between game levels or news stories.
@interface GADInterstitial : NSObject

/// Initializes an interstitial with an ad unit created on the AdMob website. Create a new ad unit
/// for every unique placement of an ad in your application. Set this to the ID assigned for this
/// placement. Ad units are important for targeting and statistics.
///
/// Example AdMob ad unit ID: @"ca-app-pub-0123456789012345/0123456789"
- (instancetype)initWithAdUnitID:(NSString *)adUnitID NS_DESIGNATED_INITIALIZER;

#pragma mark Pre-Request

/// Required value passed in with initWithAdUnitID:.
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *adUnitID;

/// Optional delegate object that receives state change notifications from this GADInterstitalAd.
@property(nonatomic, weak, GAD_NULLABLE) id<GADInterstitialDelegate> delegate;

#pragma mark Making an Ad Request

/// Makes an interstitial ad request. Additional targeting options can be supplied with a request
/// object. Only one interstitial request is allowed at a time.
///
/// This is best to do several seconds before the interstitial is needed to preload its content.
/// Then when transitioning between view controllers show the interstital with
/// presentFromViewController.
- (void)loadRequest:(GADRequest *GAD_NULLABLE_TYPE)request;

#pragma mark Post-Request

/// Returns YES if the interstitial is ready to be displayed. The delegate's
/// interstitialAdDidReceiveAd: will be called after this property switches from NO to YES.
@property(nonatomic, readonly, assign) BOOL isReady;

/// Returns YES if this object has already been presented. Interstitial objects can only be used
/// once even with different requests.
@property(nonatomic, readonly, assign) BOOL hasBeenUsed;

/// Returns the ad network class name that fetched the current ad. Returns nil while the latest ad
/// request is in progress or if the latest ad request failed. For both standard and mediated Google
/// AdMob ads, this property returns @"GADMAdapterGoogleAdMobAds". For ads fetched via mediation
/// custom events, this property returns @"GADMAdapterCustomEvents".
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *adNetworkClassName;

/// Presents the interstitial ad which takes over the entire screen until the user dismisses it.
/// This has no effect unless isReady returns YES and/or the delegate's interstitialDidReceiveAd:
/// has been received.
///
/// Set rootViewController to the current view controller at the time this method is called. If your
/// application does not use view controllers pass in nil and your views will be removed from the
/// window to show the interstitial and restored when done. After the interstitial has been removed,
/// the delegate's interstitialDidDismissScreen: will be called.
- (void)presentFromRootViewController:(UIViewController *)rootViewController;

#pragma mark Deprecated

/// Deprecated delegate. GADInAppPurchase has been deprecated.
@property(nonatomic, weak, GAD_NULLABLE)
    id<GADInAppPurchaseDelegate> inAppPurchaseDelegate GAD_DEPRECATED_ATTRIBUTE;

/// Deprecated intializer. Use initWithAdUnitID: instead.
- (instancetype)init GAD_DEPRECATED_MSG_ATTRIBUTE("Use initWithAdUnitID:.");

/// Deprecated setter, use initWithAdUnitID: instead.
- (void)setAdUnitID:(NSString *GAD_NULLABLE_TYPE)adUnitID
    GAD_DEPRECATED_MSG_ATTRIBUTE("Use initWithAdUnitID: instead of setting the ad unit ID.");

@end

GAD_ASSUME_NONNULL_END

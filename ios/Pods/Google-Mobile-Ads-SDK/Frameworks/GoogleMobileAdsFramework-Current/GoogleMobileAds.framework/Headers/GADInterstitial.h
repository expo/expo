//
//  GADInterstitial.h
//  Google Mobile Ads SDK
//
//  Copyright 2011 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADAdValue.h>
#import <GoogleMobileAds/GADInAppPurchaseDelegate.h>
#import <GoogleMobileAds/GADInterstitialDelegate.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GADRequestError.h>
#import <GoogleMobileAds/GADResponseInfo.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <UIKit/UIKit.h>

/// An interstitial ad. This is a full-screen advertisement shown at natural transition points in
/// your application such as between game levels or news stories. See
/// https://developers.google.com/admob/ios/interstitial to get started.
@interface GADInterstitial : NSObject

/// Initializes an interstitial with an ad unit created on the AdMob website. Create a new ad unit
/// for every unique placement of an ad in your application. Set this to the ID assigned for this
/// placement. Ad units are important for targeting and statistics.
///
/// Example AdMob ad unit ID: @"ca-app-pub-0123456789012345/0123456789"
- (nonnull instancetype)initWithAdUnitID:(nonnull NSString *)adUnitID NS_DESIGNATED_INITIALIZER;

#pragma mark Pre-Request

/// The interstitial's ad unit ID.
@property(nonatomic, readonly, nullable) NSString *adUnitID;

/// Optional delegate object that receives state change notifications from this GADInterstitalAd.
@property(nonatomic, weak, nullable) id<GADInterstitialDelegate> delegate;

#pragma mark Making an Ad Request

/// Makes an interstitial ad request. Additional targeting options can be supplied with a request
/// object. Only one interstitial request is allowed at a time.
///
/// This is best to do several seconds before the interstitial is needed to preload its content.
/// Then when transitioning between view controllers show the interstital with
/// presentFromViewController.
- (void)loadRequest:(nullable GADRequest *)request;

#pragma mark Post-Request

/// Returns YES if the interstitial is ready to be displayed. The delegate's
/// interstitialAdDidReceiveAd: will be called after this property switches from NO to YES.
@property(nonatomic, readonly) BOOL isReady;

/// Returns YES if this object has already been presented. Interstitial objects can only be used
/// once even with different requests.
@property(nonatomic, readonly) BOOL hasBeenUsed;

/// Information about the ad response that returned the current ad. Nil while an ad request is in
/// progress or if the latest ad request failed.
@property(nonatomic, readonly, nullable) GADResponseInfo *responseInfo;

/// Called when the ad is estimated to have earned money. Available for whitelisted accounts only.
@property(nonatomic, nullable, copy) GADPaidEventHandler paidEventHandler;

/// Presents the interstitial ad which takes over the entire screen until the user dismisses it.
/// This has no effect unless isReady returns YES and/or the delegate's interstitialDidReceiveAd:
/// has been received.
///
/// Set rootViewController to the current view controller at the time this method is called. If your
/// application does not use view controllers pass in nil and your views will be removed from the
/// window to show the interstitial and restored when done. After the interstitial has been removed,
/// the delegate's interstitialDidDismissScreen: will be called.
- (void)presentFromRootViewController:(nonnull UIViewController *)rootViewController;

/// Returns whether the interstitial can be presented from the provided root view controller. Sets
/// the error out parameter if the interstitial can't be presented. Must be called on the main
/// thread.
- (BOOL)canPresentFromRootViewController:(nonnull UIViewController *)rootViewController
                                   error:(NSError *_Nullable __autoreleasing *_Nullable)error;

#pragma mark Deprecated

/// Deprecated delegate. GADInAppPurchase is deprecated.
@property(nonatomic, weak, nullable) id<GADInAppPurchaseDelegate> inAppPurchaseDelegate
    GAD_DEPRECATED_ATTRIBUTE;

/// Deprecated intializer. Use initWithAdUnitID: instead.
- (nonnull instancetype)init GAD_DEPRECATED_MSG_ATTRIBUTE("Use initWithAdUnitID:.");

/// Deprecated setter, use initWithAdUnitID: instead.
- (void)setAdUnitID:(nullable NSString *)adUnitID
    GAD_DEPRECATED_MSG_ATTRIBUTE("Use initWithAdUnitID: instead of setting the ad unit ID.");

/// Deprecated. Use responseInfo.adNetworkClassName instead.
@property(nonatomic, readonly, nullable) NSString *adNetworkClassName GAD_DEPRECATED_MSG_ATTRIBUTE(
    "Use responseInfo.adNetworkClassName.");

@end

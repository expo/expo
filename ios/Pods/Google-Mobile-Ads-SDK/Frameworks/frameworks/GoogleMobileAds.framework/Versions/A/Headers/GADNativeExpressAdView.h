//
//  GADNativeExpressAdView.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADAdSize.h>
#import <GoogleMobileAds/GADNativeExpressAdViewDelegate.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GADVideoController.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// The view that displays native ads. A minimum implementation to get an ad from within a
/// UIViewController class is:
///
///   <pre>
///   // Create and setup the ad view, specifying the size and origin at {0, 0}.
///   GADNativeExpressAdView *adView =
///       [[GADNativeExpressAdView alloc] initWithAdSize:kGADAdSizeBanner];
///   adView.rootViewController = self;
///   adView.adUnitID = @"ID created when registering your app";
///   // Place the ad view onto the screen.
///   [self.view addSubview:adView];
///   // Request an ad without any additional targeting information.
///   [adView loadRequest:[GADRequest request]];
///   </pre>
@interface GADNativeExpressAdView : UIView

#pragma mark - Initialization

/// Returns an initialized GADNativeExpressAdView instance set to |adSize| and positioned at
/// |origin| relative to its superview bounds. Returns nil if |adSize| is an invalid ad size.
- (instancetype GAD_NULLABLE_TYPE)initWithAdSize:(GADAdSize)adSize origin:(CGPoint)origin;

/// Returns an initialized GADNativeExpressAdView instance set to |adSize| and positioned at the top
/// left of its superview. Returns nil if |adSize| is an invalid ad size.
- (instancetype GAD_NULLABLE_TYPE)initWithAdSize:(GADAdSize)adSize;

/// Video controller for controlling video rendered by this native express ad view.
@property(nonatomic, strong, readonly) GADVideoController *videoController;

#pragma mark - Pre-Request

/// Required value created on the AdMob website. Create a new ad unit for every unique placement of
/// an ad in your application. Set this to the ID assigned for this placement. Ad units are
/// important for targeting and statistics.
///
/// Example AdMob ad unit ID: @"ca-app-pub-0123456789012345/0123456789"
@property(nonatomic, copy, GAD_NULLABLE) IBInspectable NSString *adUnitID;

/// Required reference to the current root view controller. For example, the root view controller in
/// a tab-based application would be the UITabViewController.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet UIViewController *rootViewController;

/// Required to set this native ad view to a proper size. Never create your own GADAdSize directly.
/// Use one of the predefined standard ad sizes (such as kGADAdSizeBanner), or create one using the
/// GADAdSizeFromCGSize method. If you are not using mediation, changing the adSize after an ad has
/// been shown will cause a new request (for an ad of the new size) to be sent. If you are using
/// mediation, then a new request may not be sent.
@property(nonatomic, assign) GADAdSize adSize;

/// Optional delegate object that receives state change notifications from this
/// GADNativeExpressAdView. Typically this is a UIViewController.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet id<GADNativeExpressAdViewDelegate> delegate;

/// A Boolean value that determines whether autoloading of ads in the receiver is enabled. If
/// enabled, you do not need to call the loadRequest: method to load ads.
@property(nonatomic, assign, getter=isAutoloadEnabled) IBInspectable BOOL autoloadEnabled;

/// Sets options that configure ad loading.
///
/// @param adOptions An array of GADAdLoaderOptions objects. The array is deep copied and option
/// objects cannot be modified after calling this method.
- (void)setAdOptions:(NSArray *)adOptions;

#pragma mark - Making an Ad Request

/// Makes an ad request. The request object supplies targeting information.
- (void)loadRequest:(GADRequest *GAD_NULLABLE_TYPE)request;

#pragma mark - Mediation

/// The name of the ad network adapter class that fetched the current ad. Returns nil while the
/// latest ad request is in progress or if the latest ad request failed. For both standard and
/// mediated Google AdMob ads, this method returns @"GADMAdapterGoogleAdMobAds". For ads fetched via
/// mediation custom events, this method returns @"GADMAdapterCustomEvents".
@property(nonatomic, readonly, weak, GAD_NULLABLE) NSString *adNetworkClassName;

@end

GAD_ASSUME_NONNULL_END

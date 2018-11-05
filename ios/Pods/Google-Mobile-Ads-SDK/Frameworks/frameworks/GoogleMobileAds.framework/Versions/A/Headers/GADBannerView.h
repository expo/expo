//
//  GADBannerView.h
//  Google Mobile Ads SDK
//
//  Copyright 2011 Google Inc. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADAdSize.h>
#import <GoogleMobileAds/GADAdSizeDelegate.h>
#import <GoogleMobileAds/GADBannerViewDelegate.h>
#import <GoogleMobileAds/GADInAppPurchaseDelegate.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GADRequestError.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// The view that displays banner ads. A minimum implementation to get an ad from within a
/// UIViewController class is:
///
///   <pre>
///   // Create and setup the ad view, specifying the size and origin at {0, 0}.
///   GADBannerView *adView = [[GADBannerView alloc] initWithAdSize:kGADAdSizeBanner];
///   adView.rootViewController = self;
///   adView.adUnitID = @"ID created when registering your app";
///   // Place the ad view onto the screen.
///   [self.view addSubview:adView];
///   // Request an ad without any additional targeting information.
///   [adView loadRequest:[GADRequest request]];
///   </pre>
@interface GADBannerView : UIView

#pragma mark Initialization

/// Initializes and returns a banner view with the specified ad size and origin relative to the
/// banner's superview.
- (instancetype)initWithAdSize:(GADAdSize)adSize origin:(CGPoint)origin;

/// Initializes and returns a banner view with the specified ad size placed at its superview's
/// origin.
- (instancetype)initWithAdSize:(GADAdSize)adSize;

#pragma mark Pre-Request

/// Required value created on the AdMob website. Create a new ad unit for every unique placement of
/// an ad in your application. Set this to the ID assigned for this placement. Ad units are
/// important for targeting and statistics.
///
/// Example AdMob ad unit ID: @"ca-app-pub-0123456789012345/0123456789"
@property(nonatomic, copy, GAD_NULLABLE) IBInspectable NSString *adUnitID;

/// Required reference to the current root view controller. For example the root view controller in
/// tab-based application would be the UITabViewController.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet UIViewController *rootViewController;

/// Required to set this banner view to a proper size. Never create your own GADAdSize directly. Use
/// one of the predefined standard ad sizes (such as kGADAdSizeBanner), or create one using the
/// GADAdSizeFromCGSize method. If not using mediation, then changing the adSize after an ad has
/// been shown will cause a new request (for an ad of the new size) to be sent. If using mediation,
/// then a new request may not be sent.
@property(nonatomic, assign) GADAdSize adSize;

/// Optional delegate object that receives state change notifications from this GADBannerView.
/// Typically this is a UIViewController.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet id<GADBannerViewDelegate> delegate;

/// Optional delegate that is notified when creatives cause the banner to change size.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet id<GADAdSizeDelegate> adSizeDelegate;

#pragma mark Making an Ad Request

/// Makes an ad request. The request object supplies targeting information.
- (void)loadRequest:(GADRequest *GAD_NULLABLE_TYPE)request;

/// A Boolean value that determines whether autoloading of ads in the receiver is enabled. If
/// enabled, you do not need to call the loadRequest: method to load ads.
@property(nonatomic, assign, getter=isAutoloadEnabled) IBInspectable BOOL autoloadEnabled;

#pragma mark Mediation

/// The ad network class name that fetched the current ad. Returns nil while the latest ad request
/// is in progress or if the latest ad request failed. For both standard and mediated Google AdMob
/// ads, this property returns @"GADMAdapterGoogleAdMobAds". For ads fetched via mediation custom
/// events, this property returns @"GADMAdapterCustomEvents".
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *adNetworkClassName;

#pragma mark Deprecated

/// Indicates if the currently displayed ad (or most recent failure) was a result of auto refreshing
/// as specified on server. This property is set to NO after each loadRequest: method.
@property(nonatomic, readonly, assign) BOOL hasAutoRefreshed GAD_DEPRECATED_ATTRIBUTE;

/// Deprecated delegate. GADInAppPurchase has been deprecated.
@property(nonatomic, weak, GAD_NULLABLE)
    IBOutlet id<GADInAppPurchaseDelegate> inAppPurchaseDelegate GAD_DEPRECATED_ATTRIBUTE;

/// The mediated ad network's underlying ad view. You may use this property to read the ad's actual
/// size and adjust this banner view's frame origin. However, modifying the banner view's frame size
/// triggers the Mobile Ads SDK to request a new ad. Only update the banner view's frame origin.
@property(nonatomic, readonly, weak, GAD_NULLABLE)
    UIView *mediatedAdView GAD_DEPRECATED_MSG_ATTRIBUTE("Use adNetworkClassName.");

@end

GAD_ASSUME_NONNULL_END

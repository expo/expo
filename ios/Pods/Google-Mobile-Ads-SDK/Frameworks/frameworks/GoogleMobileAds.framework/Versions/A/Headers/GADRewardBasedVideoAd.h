//
//  GADRewardBasedVideoAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@protocol GADRewardBasedVideoAdDelegate;

GAD_ASSUME_NONNULL_BEGIN

/// The GADRewardBasedVideoAd class is used for requesting and presenting a reward based video ad.
/// This class isn't thread safe.
@interface GADRewardBasedVideoAd : NSObject

/// Delegate for receiving video notifications.
@property(nonatomic, weak, GAD_NULLABLE) id<GADRewardBasedVideoAdDelegate> delegate;

/// Indicates if the receiver is ready to be presented full screen.
@property(nonatomic, readonly, getter=isReady) BOOL ready;

/// The ad network class name that fetched the current ad. Returns nil while the latest ad request
/// is in progress or if the latest ad request failed. For both standard and mediated Google AdMob
/// ads, this property returns @"GADMAdapterGoogleAdMobAds". For ads fetched via mediation custom
/// events, this property returns the mediated custom event adapter.
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *adNetworkClassName;

/// Returns the shared GADRewardBasedVideoAd instance.
+ (GADRewardBasedVideoAd *)sharedInstance;

/// Initiates the request to fetch the reward based video ad. The |request| object supplies ad
/// targeting information and must not be nil. The adUnitID is the ad unit id used for fetching an
/// ad and must not be nil.
- (void)loadRequest:(GADRequest *)request withAdUnitID:(NSString *)adUnitID;

/// Presents the reward based video ad with the provided view controller.
- (void)presentFromRootViewController:(UIViewController *)viewController;

@end

GAD_ASSUME_NONNULL_END

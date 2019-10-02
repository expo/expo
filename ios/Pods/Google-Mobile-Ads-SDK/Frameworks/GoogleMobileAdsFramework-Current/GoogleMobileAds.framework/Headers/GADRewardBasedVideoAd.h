//
//  GADRewardBasedVideoAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADAdMetadataKeys.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GADRequestError.h>
#import <GoogleMobileAds/GADRewardBasedVideoAdDelegate.h>
#import <UIKit/UIKit.h>

/// The GADRewardBasedVideoAd class is used for requesting and presenting a reward based video ad.
/// This class isn't thread safe.
@interface GADRewardBasedVideoAd : NSObject

/// Delegate for receiving video notifications.
@property(nonatomic, weak, nullable) id<GADRewardBasedVideoAdDelegate> delegate;

/// Indicates whether the receiver is ready to be presented full screen.
@property(nonatomic, readonly, getter=isReady) BOOL ready;

/// The ad network class name that fetched the current ad. Returns nil while the latest ad request
/// is in progress or if the latest ad request failed. For both standard and mediated Google AdMob
/// ads, this property returns @"GADMAdapterGoogleAdMobAds". For ads fetched via mediation custom
/// events, this property returns the mediated custom event adapter.
@property(nonatomic, readonly, copy, nullable) NSString *adNetworkClassName;

/// A unique identifier used to identify the user when making server-to-server reward callbacks.
/// This value is used at both request time and during ad display. New values must only be set
/// before ad requests.
@property(nonatomic, copy, nullable) NSString *userIdentifier;

/// Optional custom reward string to include in the server-to-server callback.
@property(nonatomic, copy, nullable) NSString *customRewardString;

/// The loaded ad's metadata. Is nil if no ad is loaded or the loaded ad doesn't have metadata. Ad
/// metadata may update after loading. Use the rewardBasedVideoAdMetadataDidChange: delegate method
/// on GADRewardBasedVideoAdDelegate to listen for updates.
@property(nonatomic, readonly, nullable) NSDictionary<GADAdMetadataKey, id> *adMetadata;

/// Returns the shared GADRewardBasedVideoAd instance.
+ (nonnull GADRewardBasedVideoAd *)sharedInstance;

/// Initiates the request to fetch the reward based video ad. The |request| object supplies ad
/// targeting information and must not be nil. The adUnitID is the ad unit id used for fetching an
/// ad and must not be nil.
- (void)loadRequest:(nonnull GADRequest *)request withAdUnitID:(nonnull NSString *)adUnitID;

/// Presents the reward based video ad with the provided view controller.
- (void)presentFromRootViewController:(nonnull UIViewController *)viewController;

@end

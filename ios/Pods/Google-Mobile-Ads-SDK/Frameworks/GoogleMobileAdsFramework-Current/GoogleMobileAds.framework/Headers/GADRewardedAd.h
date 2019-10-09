//
//  GADRewardedAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADAdReward.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GADRequestError.h>
#import <GoogleMobileAds/GADResponseInfo.h>
#import <GoogleMobileAds/GADRewardedAdDelegate.h>
#import <GoogleMobileAds/GADRewardedAdMetadataDelegate.h>
#import <GoogleMobileAds/GADServerSideVerificationOptions.h>
#import <UIKit/UIKit.h>

/// A block to be executed when the ad request operation completes. If the load failed, the error
/// object is non-null and provides failure information. On success, |error| is nil.
typedef void (^GADRewardedAdLoadCompletionHandler)(GADRequestError *_Nullable error);

/// The GADRewardedAd class is used for requesting and presenting a rewarded ad.
@interface GADRewardedAd : NSObject

/// Initializes a rewarded ad with the provided ad unit ID. Create ad unit IDs using the AdMob
/// website for each unique ad placement in your app. Unique ad units improve targeting and
/// statistics.
///
/// Example AdMob ad unit ID: @"ca-app-pub-3940256099942544/1712485313"
- (nonnull instancetype)initWithAdUnitID:(nonnull NSString *)adUnitID;

/// Requests an rewarded ad and calls the provided completion handler when the request finishes.
- (void)loadRequest:(nullable GADRequest *)request
    completionHandler:(nullable GADRewardedAdLoadCompletionHandler)completionHandler;

/// The ad unit ID.
@property(nonatomic, readonly, nonnull) NSString *adUnitID;

/// Indicates whether the rewarded ad is ready to be presented.
@property(nonatomic, readonly, getter=isReady) BOOL ready;

/// Information about the ad response that returned the current ad. Nil while an ad
/// request is in progress or if the latest ad request failed.
@property(nonatomic, readonly, nullable) GADResponseInfo *responseInfo;

/// The reward earned by the user for interacting with a rewarded ad. Is nil until the ad has
/// successfully loaded.
@property(nonatomic, readonly, nullable) GADAdReward *reward;

/// Options specified for server-to-server user reward verification.
@property(nonatomic, copy, nullable)
    GADServerSideVerificationOptions *serverSideVerificationOptions;

/// The loaded ad's metadata. Is nil if no ad is loaded or the loaded ad doesn't have metadata. Ad
/// metadata may update after loading. Use the rewardedAdMetadataDidChange: delegate method on
/// GADRewardedAdMetadataDelegate to listen for updates.
@property(nonatomic, readonly, nullable) NSDictionary<GADAdMetadataKey, id> *adMetadata;

/// Delegate for ad metadata changes.
@property(nonatomic, weak, nullable) id<GADRewardedAdMetadataDelegate> adMetadataDelegate;

/// Presents the rewarded ad with the provided view controller and rewarded delegate to call back on
/// various intermission events. The delegate is strongly retained by the receiver until a terminal
/// delegate method is called. Terminal methods are -rewardedAd:didFailToPresentWithError: and
/// -rewardedAdDidClose: of GADRewardedAdDelegate.
- (void)presentFromRootViewController:(nonnull UIViewController *)viewController
                             delegate:(nonnull id<GADRewardedAdDelegate>)delegate;

#pragma mark Deprecated

/// Deprecated. Use responseInfo.adNetworkClassName instead.
@property(nonatomic, readonly, copy, nullable)
    NSString *adNetworkClassName GAD_DEPRECATED_MSG_ATTRIBUTE(
        "Use responseInfo.adNetworkClassName.");

@end

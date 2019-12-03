//
//  GADRewardedDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADAdMetadataKeys.h>
#import <GoogleMobileAds/GADAdReward.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADRewardedAd;

/// Delegate for receiving state change messages from a GADRewardedAd.
@protocol GADRewardedAdDelegate <NSObject>

@required

/// Tells the delegate that the user earned a reward.
- (void)rewardedAd:(nonnull GADRewardedAd *)rewardedAd
    userDidEarnReward:(nonnull GADAdReward *)reward;

@optional

/// Tells the delegate that the rewarded ad failed to present.
- (void)rewardedAd:(nonnull GADRewardedAd *)rewardedAd
    didFailToPresentWithError:(nonnull NSError *)error;

/// Tells the delegate that the rewarded ad was presented.
- (void)rewardedAdDidPresent:(nonnull GADRewardedAd *)rewardedAd;

/// Tells the delegate that the rewarded ad was dismissed.
- (void)rewardedAdDidDismiss:(nonnull GADRewardedAd *)rewardedAd;

@end

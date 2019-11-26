//
//  GADRewardBasedVideoAdDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADAdReward.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADRewardBasedVideoAd;

/// Delegate for receiving state change messages from a GADRewardBasedVideoAd such as ad requests
/// succeeding/failing.
@protocol GADRewardBasedVideoAdDelegate <NSObject>

@required

/// Tells the delegate that the reward based video ad has rewarded the user.
- (void)rewardBasedVideoAd:(nonnull GADRewardBasedVideoAd *)rewardBasedVideoAd
    didRewardUserWithReward:(nonnull GADAdReward *)reward;

@optional

/// Tells the delegate that the reward based video ad failed to load.
- (void)rewardBasedVideoAd:(nonnull GADRewardBasedVideoAd *)rewardBasedVideoAd
    didFailToLoadWithError:(nonnull NSError *)error;

/// Tells the delegate that a reward based video ad was received.
- (void)rewardBasedVideoAdDidReceiveAd:(nonnull GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad opened.
- (void)rewardBasedVideoAdDidOpen:(nonnull GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad started playing.
- (void)rewardBasedVideoAdDidStartPlaying:(nonnull GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad completed playing.
- (void)rewardBasedVideoAdDidCompletePlaying:(nonnull GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad closed.
- (void)rewardBasedVideoAdDidClose:(nonnull GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad will leave the application.
- (void)rewardBasedVideoAdWillLeaveApplication:(nonnull GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad's metadata changed. Called when an ad loads,
/// and when a loaded ad's metadata changes.
- (void)rewardBasedVideoAdMetadataDidChange:(nonnull GADRewardBasedVideoAd *)rewardBasedVideoAd;

@end

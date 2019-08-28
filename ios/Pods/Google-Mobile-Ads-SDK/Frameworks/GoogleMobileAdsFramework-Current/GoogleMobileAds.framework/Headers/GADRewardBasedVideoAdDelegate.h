//
//  GADRewardBasedVideoAdDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADAdReward.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

NS_ASSUME_NONNULL_BEGIN

@class GADRewardBasedVideoAd;

/// Delegate for receiving state change messages from a GADRewardBasedVideoAd such as ad requests
/// succeeding/failing.
@protocol GADRewardBasedVideoAdDelegate <NSObject>

@required

/// Tells the delegate that the reward based video ad has rewarded the user.
- (void)rewardBasedVideoAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd
    didRewardUserWithReward:(GADAdReward *)reward;

@optional

/// Tells the delegate that the reward based video ad failed to load.
- (void)rewardBasedVideoAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd
    didFailToLoadWithError:(NSError *)error;

/// Tells the delegate that a reward based video ad was received.
- (void)rewardBasedVideoAdDidReceiveAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad opened.
- (void)rewardBasedVideoAdDidOpen:(GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad started playing.
- (void)rewardBasedVideoAdDidStartPlaying:(GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad completed playing.
- (void)rewardBasedVideoAdDidCompletePlaying:(GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad closed.
- (void)rewardBasedVideoAdDidClose:(GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad will leave the application.
- (void)rewardBasedVideoAdWillLeaveApplication:(GADRewardBasedVideoAd *)rewardBasedVideoAd;

/// Tells the delegate that the reward based video ad's metadata changed. Called when an ad loads,
/// and when a loaded ad's metadata changes.
- (void)rewardBasedVideoAdMetadataDidChange:(GADRewardBasedVideoAd *)rewardBasedVideoAd;

@end

NS_ASSUME_NONNULL_END

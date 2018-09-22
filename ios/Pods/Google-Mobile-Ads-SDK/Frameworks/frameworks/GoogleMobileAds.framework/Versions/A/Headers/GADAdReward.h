//
//  GADAdReward.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Reward information for GADRewardBasedVideoAd ads.
@interface GADAdReward : NSObject

/// Type of the reward.
@property(nonatomic, readonly, copy) NSString *type;

/// Amount rewarded to the user.
@property(nonatomic, readonly, copy) NSDecimalNumber *amount;

/// Returns an initialized GADAdReward with the provided reward type and reward amount. rewardType
/// and rewardAmount must not be nil.
- (instancetype)initWithRewardType:(NSString *)rewardType
                      rewardAmount:(NSDecimalNumber *)rewardAmount NS_DESIGNATED_INITIALIZER;

@end

GAD_ASSUME_NONNULL_END

//
//  GADMRewardBasedVideoAdNetworkConnector.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google. All rights reserved.
//

#import <GoogleMobileAds/GoogleMobileAds.h>

@protocol GADMediationAdRequest;
@protocol GADMRewardBasedVideoAdNetworkAdapter;

/// Reward based video ad network adapters interact with the mediation SDK using an object that
/// conforms to the GADMRewardBasedVideoAdNetworkConnector protocol. The connector object can be
/// used to obtain information for ad requests and to call back to the mediation SDK on ad responses
/// and user interactions.
@protocol GADMRewardBasedVideoAdNetworkConnector<GADMediationAdRequest>

/// Tells the delegate that the adapter successfully set up a reward based video ad.
- (void)adapterDidSetUpRewardBasedVideoAd:
        (id<GADMRewardBasedVideoAdNetworkAdapter>)rewardBasedVideoAdAdapter;

/// Tells the delegate that the adapter failed to set up a reward based video ad.
- (void)adapter:(id<GADMRewardBasedVideoAdNetworkAdapter>)rewardBasedVideoAdAdapter
    didFailToSetUpRewardBasedVideoAdWithError:(NSError *)error;

/// Tells the delegate that a reward based video ad was clicked.
- (void)adapterDidGetAdClick:(id<GADMRewardBasedVideoAdNetworkAdapter>)adapter;

/// Tells the delegate that a reward based video ad has loaded.
- (void)adapterDidReceiveRewardBasedVideoAd:
        (id<GADMRewardBasedVideoAdNetworkAdapter>)rewardBasedVideoAdAdapter;

/// Tells the delegate that a reward based video ad has opened.
- (void)adapterDidOpenRewardBasedVideoAd:
        (id<GADMRewardBasedVideoAdNetworkAdapter>)rewardBasedVideoAdAdapter;

/// Tells the delegate that a reward based video ad has started playing.
- (void)adapterDidStartPlayingRewardBasedVideoAd:
        (id<GADMRewardBasedVideoAdNetworkAdapter>)rewardBasedVideoAdAdapter;

/// Tells the delegate that a reward based video ad has closed.
- (void)adapterDidCloseRewardBasedVideoAd:
        (id<GADMRewardBasedVideoAdNetworkAdapter>)rewardBasedVideoAdAdapter;

/// Tells the delegate that the adapter has rewarded the user.
- (void)adapter:(id<GADMRewardBasedVideoAdNetworkAdapter>)rewardBasedVideoAd
    didRewardUserWithReward:(GADAdReward *)reward;

/// Tells the delegate that a reward based video ad's action will leave the application.
- (void)adapterWillLeaveApplication:
        (id<GADMRewardBasedVideoAdNetworkAdapter>)rewardBasedVideoAdAdapter;

/// Tells the delegate that a reward based video ad failed to load.
- (void)adapter:(id<GADMRewardBasedVideoAdNetworkAdapter>)rewardBasedVideoAdAdapter
    didFailToLoadRewardBasedVideoAdwithError:(NSError *)error;

@end

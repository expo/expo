//
//  GADMediationRewardedAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/Mediation/GADMediationAd.h>
#import <GoogleMobileAds/Mediation/GADMediationAdConfiguration.h>
#import <GoogleMobileAds/Mediation/GADMediationAdEventDelegate.h>
#import <UIKit/UIKit.h>

/// Rendered rewarded ad.
@protocol GADMediationRewardedAd <GADMediationAd>
- (void)presentFromViewController:(nonnull UIViewController *)viewController;
@end

/// Rewarded ad configuration.
@interface GADMediationRewardedAdConfiguration : GADMediationAdConfiguration
@end

//
//  GADMediationInterstitialAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/Mediation/GADMediationAd.h>
#import <GoogleMobileAds/Mediation/GADMediationAdConfiguration.h>
#import <GoogleMobileAds/Mediation/GADMediationAdEventDelegate.h>
#import <UIKit/UIKit.h>

/// Rendered interstitial ad.
@protocol GADMediationInterstitialAd <GADMediationAd>

/// Presents the receiver from the view controller.
- (void)presentFromViewController:(nonnull UIViewController *)viewController;

@end

/// Interstitial ad configuration.
@interface GADMediationInterstitialAdConfiguration : GADMediationAdConfiguration
@end

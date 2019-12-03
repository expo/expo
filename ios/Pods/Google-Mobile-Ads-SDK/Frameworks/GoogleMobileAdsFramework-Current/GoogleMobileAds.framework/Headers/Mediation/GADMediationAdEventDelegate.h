//
//  GADMediationAdEventDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADAdReward.h>
#import <UIKit/UIKit.h>

/// Reports information to the Google Mobile Ads SDK from the adapter. Adapters receive an ad event
/// delegate when they provide a GADMediationAd by calling a render completion handler.
@protocol GADMediationAdEventDelegate <NSObject>

/// Notifies Google Mobile Ads SDK that an impression occurred on the GADMediationAd.
- (void)reportImpression;

/// Notifies Google Mobile Ads SDK that a click occurred on the GADMediationAd.
- (void)reportClick;

/// Notifies Google Mobile Ads SDK that the GADMediationAd will present a full screen modal view.
- (void)willPresentFullScreenView;

/// Notifies Google Mobile Ads SDK that the GADMediationAd failed to present with an error.
- (void)didFailToPresentWithError:(nonnull NSError *)error;

/// Notifies Google Mobile Ads SDK that the GADMediationAd will dismiss a full screen modal view.
- (void)willDismissFullScreenView;

/// Notifies Google Mobile Ads SDK that the GADMediationAd finished dismissing a full screen modal
/// view.
- (void)didDismissFullScreenView;

@end

/// Reports banner related information to the Google Mobile Ads SDK from the adapter.
@protocol GADMediationBannerAdEventDelegate <GADMediationAdEventDelegate>

/// Notifies Google Mobile Ads SDK that an action on the GADMediationAd will cause the application
/// to move into the background.
- (void)willBackgroundApplication;

@end

/// Reports interstitial related information to the Google Mobile Ads SDK from the adapter.
@protocol GADMediationInterstitialAdEventDelegate <GADMediationAdEventDelegate>

/// Notifies Google Mobile Ads SDK that an action on the GADMediationAd will cause the application
/// to move into the background.
- (void)willBackgroundApplication;

@end

/// Reports native related information to the Google Mobile Ads SDK from the adapter.
@protocol GADMediationNativeAdEventDelegate <GADMediationAdEventDelegate>

/// Notifies Google Mobile Ads SDK that the GADMediationAd started video playback.
- (void)didPlayVideo;

/// Notifies Google Mobile Ads SDK that the GADMediationAd paused video playback.
- (void)didPauseVideo;

/// Notifies Google Mobile Ads SDK that the GADMediationAd's video playback finished.
- (void)didEndVideo;

/// Notifies Google Mobile Ads SDK that the GADMediationAd muted video playback.
- (void)didMuteVideo;

/// Notifies Google Mobile Ads SDK that the GADMediationAd unmuted video playback.
- (void)didUnmuteVideo;

/// Notifies Google Mobile Ads SDK that an action on the GADMediationAd will cause the application
/// to move into the background.
- (void)willBackgroundApplication;

@end

/// Reports rewarded related information to the Google Mobile Ads SDK from the adapter.
@protocol GADMediationRewardedAdEventDelegate <GADMediationAdEventDelegate>

/// Notifies the Google Mobile Ads SDK that the GADMediationAd has rewarded the user with a reward.
- (void)didRewardUserWithReward:(nonnull GADAdReward *)reward;

/// Notifies Google Mobile Ads SDK that the GADMediationAd started video playback.
- (void)didStartVideo;

/// Notifies Google Mobile Ads SDK that the GADMediationAd's video playback finished.
- (void)didEndVideo;

@end

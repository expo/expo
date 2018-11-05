//
//  GADAdChoicesView.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google Inc. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADNativeAd.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Displays AdChoices content.
///
/// If a GADAdChoicesView is set on GADNativeAppInstallAdView or GADNativeContentAdView prior to
/// calling -setNativeAppInstallAd: or -setNativeContentAd:, AdChoices content will render inside
/// the GADAdChoicesView. By default, AdChoices is placed in the top right corner of
/// GADNativeAppInstallAdView and GADNativeContentAdView.
@interface GADAdChoicesView : UIView

/// Native ad object that contains the AdChoices asset. Set this property to populate this view's
/// content.
@property(nonatomic, weak) GADNativeAd *nativeAd;

@end

GAD_ASSUME_NONNULL_END

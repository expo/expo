//
//  GADAdChoicesView.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <UIKit/UIKit.h>

/// Displays AdChoices content.
///
/// If a GADAdChoicesView is set on GADNativeAppInstallAdView or GADNativeContentAdView prior to
/// calling -setNativeAppInstallAd: or -setNativeContentAd:, AdChoices content will render inside
/// the GADAdChoicesView. By default, AdChoices is placed in the top right corner of
/// GADNativeAppInstallAdView and GADNativeContentAdView.
@interface GADAdChoicesView : UIView
@end

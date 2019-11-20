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
/// If a GADAdChoicesView is set on GADUnifiedNativeAdView prior to calling -setNativeAd:, AdChoices
/// content will render inside the GADAdChoicesView. By default, AdChoices is placed in the top
/// right corner of GADUnifiedNativeAdView.
@interface GADAdChoicesView : UIView
@end

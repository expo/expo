//
//  GADInstreamAdView.h
//  Google Mobile Ads SDK
//
//  Copyright 2019 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADInstreamAd.h>

/// A view that displays instream video ads.
@interface GADInstreamAdView : UIView

/// The instream ad. The ad will begin playing when the GADInstreamAdView is visible.
@property(nonatomic, nullable) GADInstreamAd *ad;

@end

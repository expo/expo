//
//  DFPInterstitial.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/DFPCustomRenderedInterstitialDelegate.h>
#import <GoogleMobileAds/GADAppEventDelegate.h>
#import <GoogleMobileAds/GADInterstitial.h>

/// Google Ad Manager interstitial ad, a full-screen advertisement shown at natural
/// transition points in your application such as between game levels or news stories.
@interface DFPInterstitial : GADInterstitial

/// Initializes an interstitial with an ad unit created on the Ad Manager website. Create a new ad
/// unit for every unique placement of an ad in your application. Set this to the ID assigned for
/// this placement. Ad units are important for targeting and statistics.
///
/// Example Ad Manager ad unit ID: @"/6499/example/interstitial"
- (nonnull instancetype)initWithAdUnitID:(nonnull NSString *)adUnitID NS_DESIGNATED_INITIALIZER;

/// Optional delegate that is notified when creatives send app events.
@property(nonatomic, weak, nullable) id<GADAppEventDelegate> appEventDelegate;

/// Optional delegate object for custom rendered ads.
@property(nonatomic, weak, nullable) id<DFPCustomRenderedInterstitialDelegate>
    customRenderedInterstitialDelegate;

@end

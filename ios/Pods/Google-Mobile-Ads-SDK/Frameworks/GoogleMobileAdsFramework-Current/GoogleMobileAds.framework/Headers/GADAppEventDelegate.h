//
//  GADAppEventDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADBannerView;
@class GADInterstitial;

/// Implement your app event within these methods. The delegate will be notified when the SDK
/// receives an app event message from the ad.
@protocol GADAppEventDelegate <NSObject>

@optional

/// Called when the banner receives an app event.
- (void)adView:(nonnull GADBannerView *)banner
    didReceiveAppEvent:(nonnull NSString *)name
              withInfo:(nullable NSString *)info;

/// Called when the interstitial receives an app event.
- (void)interstitial:(nonnull GADInterstitial *)interstitial
    didReceiveAppEvent:(nonnull NSString *)name
              withInfo:(nullable NSString *)info;

@end

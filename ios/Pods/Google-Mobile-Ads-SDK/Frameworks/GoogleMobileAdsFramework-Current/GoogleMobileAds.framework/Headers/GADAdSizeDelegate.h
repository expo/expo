//
//  GADAdSizeDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADAdSize.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADBannerView;

/// The class implementing this protocol will be notified when the GADBannerView's ad content
/// changes size. Any views that may be affected by the banner size change will have time to adjust.
@protocol GADAdSizeDelegate <NSObject>

/// Called before the ad view changes to the new size.
- (void)adView:(nonnull GADBannerView *)bannerView willChangeAdSizeTo:(GADAdSize)size;

@end

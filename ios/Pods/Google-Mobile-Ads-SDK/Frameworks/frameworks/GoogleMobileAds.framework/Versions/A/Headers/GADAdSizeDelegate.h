//
//  GADAdSizeDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GADAdSize.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADBannerView;

GAD_ASSUME_NONNULL_BEGIN

/// The class implementing this protocol will be notified when the DFPBannerView changes ad size.
/// Any views that may be affected by the banner size change will have time to adjust.
@protocol GADAdSizeDelegate<NSObject>

/// Called before the ad view changes to the new size.
- (void)adView:(GADBannerView *)bannerView willChangeAdSizeTo:(GADAdSize)size;

@end

GAD_ASSUME_NONNULL_END

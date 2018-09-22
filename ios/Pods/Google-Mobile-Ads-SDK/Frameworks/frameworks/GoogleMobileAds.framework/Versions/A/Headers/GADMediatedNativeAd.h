//
//  GADMediatedNativeAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GADMediatedNativeAdDelegate.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Base protocol for mediated native ads.
@protocol GADMediatedNativeAd<NSObject>

/// Returns a delegate object that receives state change notifications.
- (nullable id<GADMediatedNativeAdDelegate>)mediatedNativeAdDelegate;

/// Returns a dictionary of asset names and object pairs for assets that are not handled by
/// properties of the GADMediatedNativeAd subclass.
- (NSDictionary *GAD_NULLABLE_TYPE)extraAssets;

@end

GAD_ASSUME_NONNULL_END

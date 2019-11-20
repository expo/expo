//
//  GADMediatedNativeAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/Mediation/GADMediatedNativeAdDelegate.h>

/// Base protocol for mediated native ads.
@protocol GADMediatedNativeAd <NSObject>

/// Returns a delegate object that receives state change notifications.
- (nullable id<GADMediatedNativeAdDelegate>)mediatedNativeAdDelegate;

/// Returns a dictionary of asset names and object pairs for assets that are not handled by
/// properties of the GADMediatedNativeAd subclass.
- (nullable NSDictionary *)extraAssets;

@end

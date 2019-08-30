//
//  GADAdLoaderDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADRequestError.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADAdLoader;

/// Base ad loader delegate protocol. Ad types provide extended protocols that declare methods to
/// handle successful ad loads.
@protocol GADAdLoaderDelegate <NSObject>

/// Called when adLoader fails to load an ad.
- (void)adLoader:(nonnull GADAdLoader *)adLoader
    didFailToReceiveAdWithError:(nonnull GADRequestError *)error;

@optional

/// Called after adLoader has finished loading.
- (void)adLoaderDidFinishLoading:(nonnull GADAdLoader *)adLoader;

@end

//
//  GADAdLoaderDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GADRequestError.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADAdLoader;

GAD_ASSUME_NONNULL_BEGIN

/// Base ad loader delegate protocol. Ad types provide extended protocols that declare methods to
/// handle successful ad loads.
@protocol GADAdLoaderDelegate<NSObject>

/// Called when adLoader fails to load an ad.
- (void)adLoader:(GADAdLoader *)adLoader didFailToReceiveAdWithError:(GADRequestError *)error;

@optional

/// Called after adLoader has finished loading.
- (void)adLoaderDidFinishLoading:(GADAdLoader *)adLoader;

@end

GAD_ASSUME_NONNULL_END

//
//  GADMultipleAdsAdLoaderOptions.h
//  Google Mobile Ads SDK
//
//  Copyright 2017 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADAdLoader.h>

/// Ad loader options for requesting multiple ads. Requesting multiple ads in a single request is
/// currently only available for native app install ads and native content ads.
@interface GADMultipleAdsAdLoaderOptions : GADAdLoaderOptions

/// Number of ads the GADAdLoader should attempt to return for the request. By default, numberOfAds
/// is one. Requests are invalid and will fail if numberOfAds is less than one. If numberOfAds
/// exceeds the maximum limit (5), only the maximum number of ads are requested.
///
/// The ad loader makes at least one and up to numberOfAds calls to the "ad received" and
/// -didFailToReceiveAdWithError: methods found in GADAdLoaderDelegate and its extensions, followed
/// by a single call to -adLoaderDidFinishLoading: once loading is finished.
@property(nonatomic) NSInteger numberOfAds;

@end

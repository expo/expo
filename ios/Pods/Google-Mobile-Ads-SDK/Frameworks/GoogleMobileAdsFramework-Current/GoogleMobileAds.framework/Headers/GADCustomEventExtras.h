//
//  GADCustomEventExtras.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADAdNetworkExtras.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// Create an instance of this class to set additional parameters for each custom event object. The
/// additional parameters for a custom event are keyed by the custom event label. These extras are
/// passed to your implementation of GADCustomEventBanner or GADCustomEventInterstitial.
@interface GADCustomEventExtras : NSObject <GADAdNetworkExtras>

/// Set additional parameters for the custom event with label |label|. To remove additional
/// parameters associated with |label|, pass in nil for |extras|.
- (void)setExtras:(nullable NSDictionary *)extras forLabel:(nonnull NSString *)label;

/// Retrieve the extras for |label|.
- (nullable NSDictionary *)extrasForLabel:(nonnull NSString *)label;

/// Removes all the extras set on this instance.
- (void)removeAllExtras;

/// Returns all the extras set on this instance.
- (nonnull NSDictionary *)allExtras;

@end

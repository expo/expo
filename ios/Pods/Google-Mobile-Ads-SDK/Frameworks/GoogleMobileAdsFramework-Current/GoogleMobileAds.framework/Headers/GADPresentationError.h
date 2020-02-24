//
//  GADPresentError.h
//  Google Mobile Ads SDK
//
//  Copyright 2019 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADRequestError.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// Error codes in the Google Mobile Ads SDK domain that surface due to errors when attempting to
/// present an ad.
typedef NS_ENUM(NSInteger, GADPresentationErrorCode) {

  /// Ad isn't ready to be shown.
  GADPresentationErrorCodeAdNotReady = 15,

  /// Ad is too large for the scene.
  GADPresentationErrorCodeAdTooLarge = 16,

  /// Internal error.
  GADPresentationErrorCodeInternal = 17,

  /// Ad has already been used.
  GADPresentationErrorCodeAdAlreadyUsed = 18,
};

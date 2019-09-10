//
//  GADRequestError.h
//  Google Mobile Ads SDK
//
//  Copyright 2011 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADRequest;

NS_ASSUME_NONNULL_BEGIN

/// Google AdMob Ads error domain.
GAD_EXTERN NSString *const kGADErrorDomain;

/// NSError codes for GAD error domain.
typedef NS_ENUM(NSInteger, GADErrorCode) {
  /// The ad request is invalid. The localizedFailureReason error description will have more
  /// details. Typically this is because the ad did not have the ad unit ID or root view
  /// controller set.
  kGADErrorInvalidRequest,

  /// The ad request was successful, but no ad was returned.
  kGADErrorNoFill,

  /// There was an error loading data from the network.
  kGADErrorNetworkError,

  /// The ad server experienced a failure processing the request.
  kGADErrorServerError,

  /// The current device's OS is below the minimum required version.
  kGADErrorOSVersionTooLow,

  /// The request was unable to be loaded before being timed out.
  kGADErrorTimeout,

  /// Will not send request because the interstitial object has already been used.
  kGADErrorInterstitialAlreadyUsed,

  /// The mediation response was invalid.
  kGADErrorMediationDataError,

  /// Error finding or creating a mediation ad network adapter.
  kGADErrorMediationAdapterError,

  /// The mediation request was successful, but no ad was returned from any ad networks.
  kGADErrorMediationNoFill,

  /// Attempting to pass an invalid ad size to an adapter.
  kGADErrorMediationInvalidAdSize,

  /// Internal error.
  kGADErrorInternalError,

  /// Invalid argument error.
  kGADErrorInvalidArgument,

  /// Received invalid response.
  kGADErrorReceivedInvalidResponse,

  /// Will not send request because the rewarded ad object has already been used.
  kGADErrorRewardedAdAlreadyUsed,
};

/// Represents the error generated due to invalid request parameters.
@interface GADRequestError : NSError
@end

NS_ASSUME_NONNULL_END

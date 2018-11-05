//
//  GADAdNetworkExtras.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// An object implementing this protocol contains information set by the publisher on the client
/// device for a particular ad network.
///
/// Ad networks should create an 'extras' object implementing this protocol for their publishers to
/// use.
@protocol GADAdNetworkExtras<NSObject>
@end

GAD_ASSUME_NONNULL_END

//
//  GMSGeocoder.h
//  Google Maps SDK for iOS
//
//  Copyright 2012 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>

#import "GMSAddress.h"

NS_ASSUME_NONNULL_BEGIN;

@class GMSReverseGeocodeResponse;

/**
 * \defgroup GeocoderErrorCode GMSGeocoderErrorCode
 * @{
 */

/**
 * GMSGeocoder error codes, embedded in NSError.
 */
typedef NS_ENUM(NSInteger, GMSGeocoderErrorCode) {
  kGMSGeocoderErrorInvalidCoordinate = 1,
  kGMSGeocoderErrorInternal,
};

/**@}*/

/**
 * Handler that reports a reverse geocoding response, or error.
 *
 * @related GMSGeocoder
 */
typedef void (^GMSReverseGeocodeCallback)(GMSReverseGeocodeResponse *_Nullable,
                                          NSError *_Nullable);

/**
 * Exposes a service for reverse geocoding. This maps Earth coordinates (latitude and longitude) to
 * a collection of addresses near that coordinate.
 */
@interface GMSGeocoder : NSObject

/* Convenience constructor for GMSGeocoder. */
+ (GMSGeocoder *)geocoder;

/**
 * Reverse geocodes a coordinate on the Earth's surface.
 *
 * @param coordinate The coordinate to reverse geocode.
 * @param handler The callback to invoke with the reverse geocode results.
 *        The callback will be invoked asynchronously from the main thread.
 */
- (void)reverseGeocodeCoordinate:(CLLocationCoordinate2D)coordinate
               completionHandler:(GMSReverseGeocodeCallback)handler;

@end

/** A collection of results from a reverse geocode request. */
@interface GMSReverseGeocodeResponse : NSObject<NSCopying>

/** Returns the first result, or nil if no results were available. */
- (nullable GMSAddress *)firstResult;

/** Returns an array of all the results (contains GMSAddress), including the first result. */
- (nullable NSArray<GMSAddress *> *)results;

@end

NS_ASSUME_NONNULL_END;

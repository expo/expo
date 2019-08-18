//
//  GMSPanoramaService.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>

@class GMSPanorama;

NS_ASSUME_NONNULL_BEGIN;

/**
 * Callback for when a panorama metadata becomes available.
 * If an error occurred, |panorama| is nil and |error| is not nil.
 * Otherwise, |panorama| is not nil and |error| is nil.
 *
 * @related GMSPanoramaService
 */
typedef void (^GMSPanoramaCallback)(GMSPanorama *_Nullable panorama, NSError *_Nullable error);

/**
 * GMSPanoramaService can be used to request panorama metadata even when a GMSPanoramaView is not
 * active.
 *
 * Get an instance like this: [[GMSPanoramaService alloc] init].
 */
@interface GMSPanoramaService : NSObject

/**
 * Retrieves information about a panorama near the given |coordinate|.
 *
 * This is an asynchronous request, |callback| will be called with the result.
 */
- (void)requestPanoramaNearCoordinate:(CLLocationCoordinate2D)coordinate
                             callback:(GMSPanoramaCallback)callback;

/**
 * Similar to requestPanoramaNearCoordinate:callback: but allows specifying a search radius (meters)
 * around |coordinate|.
 */
- (void)requestPanoramaNearCoordinate:(CLLocationCoordinate2D)coordinate
                               radius:(NSUInteger)radius
                             callback:(GMSPanoramaCallback)callback;

/**
 * Retrieves information about a panorama with the given |panoramaID|.
 *
 * |callback| will be called with the result. Only panoramaIDs obtained from the Google Maps SDK for
 * iOS are supported.
 */
- (void)requestPanoramaWithID:(NSString *)panoramaID callback:(GMSPanoramaCallback)callback;

@end

NS_ASSUME_NONNULL_END;

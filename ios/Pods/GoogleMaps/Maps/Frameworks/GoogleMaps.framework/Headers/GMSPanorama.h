//
//  GMSPanorama.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>

@class GMSPanoramaLink;

NS_ASSUME_NONNULL_BEGIN

/**
 * GMSPanorama represents metadata for a specific panorama on the Earth. This class is not
 * instantiable directly and is obtained via GMSPanoramaService or GMSPanoramaView.
 */
@interface GMSPanorama : NSObject

/** The precise location of this panorama. */
@property(nonatomic, readonly) CLLocationCoordinate2D coordinate;

/** The ID of this panorama. Panoramas may change ID over time, so this should not be persisted */
@property(nonatomic, copy, readonly) NSString *panoramaID;

/** An array of GMSPanoramaLink describing the neighboring panoramas. */
@property(nonatomic, copy, readonly) NSArray<GMSPanoramaLink *> *links;

@end

NS_ASSUME_NONNULL_END

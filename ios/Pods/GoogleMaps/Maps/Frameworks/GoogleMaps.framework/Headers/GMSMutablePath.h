//
//  GMSMutablePath.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import "GMSPath.h"

#import <CoreLocation/CoreLocation.h>
#import <Foundation/Foundation.h>

/**
 * GMSMutablePath is a dynamic (resizable) array of CLLocationCoordinate2D. All coordinates must be
 * valid. GMSMutablePath is the mutable counterpart to the immutable GMSPath.
 */
@interface GMSMutablePath : GMSPath

/** Adds |coord| at the end of the path. */
- (void)addCoordinate:(CLLocationCoordinate2D)coord;

/** Adds a new CLLocationCoordinate2D instance with the given lat/lng. */
- (void)addLatitude:(CLLocationDegrees)latitude longitude:(CLLocationDegrees)longitude;

/**
 * Inserts |coord| at |index|.
 *
 * If this is smaller than the size of the path, shifts all coordinates forward by one. Otherwise,
 * behaves as replaceCoordinateAtIndex:withCoordinate:.
 */
- (void)insertCoordinate:(CLLocationCoordinate2D)coord atIndex:(NSUInteger)index;

/**
 * Replace the coordinate at |index| with |coord|. If |index| is after the end, grows the array with
 * an undefined coordinate.
 */
- (void)replaceCoordinateAtIndex:(NSUInteger)index
                  withCoordinate:(CLLocationCoordinate2D)coord;

/**
 * Remove entry at |index|.
 *
 * If |index| < count decrements size. If |index| >= count this is a silent no-op.
 */
- (void)removeCoordinateAtIndex:(NSUInteger)index;

/**
 * Removes the last coordinate of the path.
 *
 * If the array is non-empty decrements size. If the array is empty, this is a silent no-op.
 */
- (void)removeLastCoordinate;

/** Removes all coordinates in this path. */
- (void)removeAllCoordinates;

@end

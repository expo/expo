//
//  GMSCoordinateBounds.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>

NS_ASSUME_NONNULL_BEGIN;

/**
 * GMSCoordinateBounds represents a rectangular bounding box on the Earth's surface.
 * GMSCoordinateBounds is immutable and can't be modified after construction.
 */
@interface GMSCoordinateBounds : NSObject

/** The North-East corner of these bounds. */
@property(nonatomic, readonly) CLLocationCoordinate2D northEast;

/** The South-West corner of these bounds. */
@property(nonatomic, readonly) CLLocationCoordinate2D southWest;

/**
 * Returns NO if this bounds does not contain any points. For example,
 * [[GMSCoordinateBounds alloc] init].valid == NO.
 *
 * When an invalid bounds is expanded with valid coordinates via includingCoordinate: or
 * includingBounds:, the resulting bounds will be valid but contain only the new coordinates.
 */
@property(nonatomic, readonly, getter=isValid) BOOL valid;

/**
 * Inits the northEast and southWest bounds corresponding to the rectangular region defined by the
 * two corners.
 *
 * It is ambiguous whether the longitude of the box extends from |coord1| to |coord2| or vice-versa;
 * the box is constructed as the smaller of the two variants, eliminating the ambiguity.
 */
- (id)initWithCoordinate:(CLLocationCoordinate2D)coord1 coordinate:(CLLocationCoordinate2D)coord2;

/**
 * Returns a GMSCoordinateBounds representing the current bounds extended to include the passed-in
 * coordinate.
 *
 * If the current bounds is invalid, the result is a valid bounds containing only |coordinate|.
 */
- (GMSCoordinateBounds *)includingCoordinate:(CLLocationCoordinate2D)coordinate;

/**
 * Returns a GMSCoordinateBounds representing the current bounds extended to include the entire
 * other bounds.
 *
 * If the current bounds is invalid, the result is a valid bounds equal to |other|.
 */
- (GMSCoordinateBounds *)includingBounds:(GMSCoordinateBounds *)other;

/**
 * Returns YES if |coordinate| is contained within this bounds. This includes points that lie
 * exactly on the edge of the bounds.
 */
- (BOOL)containsCoordinate:(CLLocationCoordinate2D)coordinate;

/**
 * Returns YES if |other| overlaps with this bounds. Two bounds are overlapping if there is at least
 * one coordinate point contained by both.
 */
- (BOOL)intersectsBounds:(GMSCoordinateBounds *)other;

@end

NS_ASSUME_NONNULL_END;

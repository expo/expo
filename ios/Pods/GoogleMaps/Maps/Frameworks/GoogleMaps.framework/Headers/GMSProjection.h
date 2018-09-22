//
//  GMSProjection.h
//  Google Maps SDK for iOS
//
//  Copyright 2012 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreGraphics/CoreGraphics.h>
#import <CoreLocation/CoreLocation.h>

/**
 * GMSVisibleRegion contains the four points defining the polygon that is visible in a map's camera.
 *
 * This polygon can be a trapezoid instead of a rectangle, because a camera can have tilt. If the
 * camera is directly over the center of the camera, the shape is rectangular, but if the camera is
 * tilted, the shape will appear to be a trapezoid whose smallest side is closest to the point of
 * view.
 */
typedef struct {

  /** Bottom left corner of the camera. */
  CLLocationCoordinate2D nearLeft;

  /** Bottom right corner of the camera. */
  CLLocationCoordinate2D nearRight;

  /** Far left corner of the camera. */
  CLLocationCoordinate2D farLeft;

  /** Far right corner of the camera. */
  CLLocationCoordinate2D farRight;
} GMSVisibleRegion;

/**
 * Defines a mapping between Earth coordinates (CLLocationCoordinate2D) and coordinates in the map's
 * view (CGPoint). A projection is constant and immutable, in that the mapping it embodies never
 * changes. The mapping is not necessarily linear.
 *
 * Passing invalid Earth coordinates (i.e., per CLLocationCoordinate2DIsValid) to this object may
 * result in undefined behavior.
 *
 * This class should not be instantiated directly, instead, obtained via projection on GMSMapView.
 */
@interface GMSProjection : NSObject

/** Maps an Earth coordinate to a point coordinate in the map's view. */
- (CGPoint)pointForCoordinate:(CLLocationCoordinate2D)coordinate;

/** Maps a point coordinate in the map's view to an Earth coordinate. */
- (CLLocationCoordinate2D)coordinateForPoint:(CGPoint)point;

/**
 * Converts a distance in meters to content size.  This is only accurate for small Earth distances,
 * as it uses CGFloat for screen distances.
 */
- (CGFloat)pointsForMeters:(CLLocationDistance)meters
              atCoordinate:(CLLocationCoordinate2D)coordinate;

/**
 * Returns whether a given coordinate (lat/lng) is contained within the projection.
 */
- (BOOL)containsCoordinate:(CLLocationCoordinate2D)coordinate;

/**
 * Returns the region (four location coordinates) that is visible according to the projection. If
 * padding was set on GMSMapView, this region takes the padding into account.
 *
 * The visible region can be non-rectangular. The result is undefined if the projection includes
 * points that do not map to anywhere on the map (e.g., camera sees outer space).
 */
- (GMSVisibleRegion)visibleRegion;

@end

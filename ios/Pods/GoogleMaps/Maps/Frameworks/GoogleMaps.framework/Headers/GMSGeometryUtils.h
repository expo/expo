//
//  GMSGeometryUtils.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

/**
 * \defgroup GeometryUtils GMSGeometryUtils
 * @{
 */

#import <CoreLocation/CoreLocation.h>

#import "GMSPath.h"

@class GMSPath;
@class GMSStrokeStyle;
@class GMSStyleSpan;

NS_ASSUME_NONNULL_BEGIN;

/** Average Earth radius in meters. */
static const CLLocationDistance kGMSEarthRadius = 6371009.0;

/**
 * A point on the map. May represent a projected coordinate.
 *
 * x is in [-1, 1]. The axis direction is normal: y grows towards North, x grows towards East. (0,
 * 0) is the center of the map.
 *
 * See GMSProject() and GMSUnproject().
 */
typedef struct GMSMapPoint {
  double x;
  double y;
} GMSMapPoint;

/** Projects |coordinate| to the map. |coordinate| must be valid. */
FOUNDATION_EXPORT
GMSMapPoint GMSProject(CLLocationCoordinate2D coordinate);

/** Unprojects |point| from the map. point.x must be in [-1, 1]. */
FOUNDATION_EXPORT
CLLocationCoordinate2D GMSUnproject(GMSMapPoint point);

/**
 * Returns a linearly interpolated point on the segment [a, b], at the fraction |t| from |a|. |t|==0
 * corresponds to |a|, |t|==1 corresponds to |b|.
 *
 * The interpolation takes place along the short path between the points potentially crossing the
 * date line. E.g. interpolating from San Francisco to Tokyo will pass north of Hawaii and cross the
 * date line.
 */
FOUNDATION_EXPORT
GMSMapPoint GMSMapPointInterpolate(GMSMapPoint a, GMSMapPoint b, double t);

/**
 * Returns the length of the segment [a, b] in projected space.
 *
 * The length is computed along the short path between the points potentially crossing the date
 * line. E.g. the distance between the points corresponding to San Francisco and Tokyo measures the
 * segment that passes north of Hawaii crossing the date line.
 */
FOUNDATION_EXPORT
double GMSMapPointDistance(GMSMapPoint a, GMSMapPoint b);

/**
 * Returns whether |point| lies inside of path. The path is always considered closed, regardless of
 * whether the last point equals the first or not.
 *
 * Inside is defined as not containing the South Pole -- the South Pole is always outside.
 *
 * |path| describes great circle segments if |geodesic| is YES, and rhumb (loxodromic) segments
 * otherwise.
 *
 * If |point| is exactly equal to one of the vertices, the result is YES. A point that is not equal
 * to a vertex is on one side or the other of any path segment -- it can never be "exactly on the
 * border".
 *
 * See GMSGeometryIsLocationOnPath() for a border test with tolerance.
 */
FOUNDATION_EXPORT
BOOL GMSGeometryContainsLocation(CLLocationCoordinate2D point, GMSPath *path, BOOL geodesic);

/**
 * Returns whether |point| lies on or near |path|, within the specified |tolerance| in meters.
 * |path| is composed of great circle segments if |geodesic| is YES, and of rhumb (loxodromic)
 * segments if |geodesic| is NO.
 *
 * See also GMSGeometryIsLocationOnPath(point, path, geodesic).
 *
 * The tolerance, in meters, is relative to the spherical radius of the Earth. If you need to work
 * on a sphere of different radius, you may compute the equivalent tolerance from the desired
 * tolerance on the sphere of radius R: tolerance = toleranceR * (RadiusEarth / R), with
 * RadiusEarth==6371009.
 */
FOUNDATION_EXPORT
BOOL GMSGeometryIsLocationOnPathTolerance(CLLocationCoordinate2D point,
                                          GMSPath *path,
                                          BOOL geodesic,
                                          CLLocationDistance tolerance);

/**
 * Same as GMSGeometryIsLocationOnPath(point, path, geodesic, tolerance), with a default tolerance
 * of 0.1 meters.
 */
FOUNDATION_EXPORT
BOOL GMSGeometryIsLocationOnPath(CLLocationCoordinate2D point, GMSPath *path, BOOL geodesic);

/**
 * Returns the great circle distance between two coordinates, in meters, on Earth.
 *
 * This is the shortest distance between the two coordinates on the sphere.
 *
 * Both coordinates must be valid.
 */
FOUNDATION_EXPORT
CLLocationDistance GMSGeometryDistance(CLLocationCoordinate2D from, CLLocationCoordinate2D to);

/**
 * Returns the great circle length of |path|, in meters, on Earth.
 *
 * This is the sum of GMSGeometryDistance() over the path segments.
 *
 * All the coordinates of the path must be valid.
 */
FOUNDATION_EXPORT
CLLocationDistance GMSGeometryLength(GMSPath *path);

/**
 * Returns the area of a geodesic polygon defined by |path| on Earth.
 *
 * The "inside" of the polygon is defined as not containing the South pole.
 *
 * If |path| is not closed, it is implicitly treated as a closed path nevertheless and the result is
 * the same.
 *
 * All coordinates of the path must be valid.
 *
 * The polygon must be simple (not self-overlapping) and may be concave.
 *
 * If any segment of the path is a pair of antipodal points, the result is undefined -- because two
 * antipodal points do not form a unique great circle segment on the sphere.
 */
FOUNDATION_EXPORT
double GMSGeometryArea(GMSPath *path);

/**
 * Returns the signed area of a geodesic polygon defined by |path| on Earth.
 *
 * The result has the same absolute value as GMSGeometryArea(); it is positive if the points of path
 * are in counter-clockwise order, and negative otherwise.
 *
 * The same restrictions as on GMSGeometryArea() apply.
 */
FOUNDATION_EXPORT
double GMSGeometrySignedArea(GMSPath *path);

/**
 * Returns the initial heading (degrees clockwise of North) at |from| of the shortest path to |to|.
 *
 * The returned value is in the range [0, 360).
 *
 * Returns 0 if the two coordinates are the same.
 *
 * Both coordinates must be valid.
 *
 * To get the final heading at |to| one may use (GMSGeometryHeading(|to|, |from|) + 180) modulo 360.
 */
FOUNDATION_EXPORT
CLLocationDirection GMSGeometryHeading(CLLocationCoordinate2D from, CLLocationCoordinate2D to);

/**
 * Returns the destination coordinate, when starting at |from| with initial |heading|, travelling
 * |distance| meters along a great circle arc, on Earth.
 *
 * The resulting longitude is in the range [-180, 180).
 *
 * Both coordinates must be valid.
 */
FOUNDATION_EXPORT
CLLocationCoordinate2D GMSGeometryOffset(CLLocationCoordinate2D from,
                                         CLLocationDistance distance,
                                         CLLocationDirection heading);

/**
 * Returns the coordinate that lies the given |fraction| of the way between the |from| and |to|
 * coordinates on the shortest path between the two.
 *
 * The resulting longitude is in the range [-180, 180).
 */
FOUNDATION_EXPORT
CLLocationCoordinate2D GMSGeometryInterpolate(CLLocationCoordinate2D from,
                                              CLLocationCoordinate2D to,
                                              double fraction);

/**
 * Returns an NSArray of GMSStyleSpan constructed by repeated application of style and length
 * information from |styles| and |lengths| along |path|.
 *
 * |path| the path along which the output spans are computed.
 * |styles| an NSArray of GMSStrokeStyle. Wraps if consumed. Can't be empty.
 * |lengths| an NSArray of NSNumber; each entry gives the length of the corresponding
 *           style from |styles|. Wraps if consumed. Can't be empty.
 * |lengthKind| the interpretation of values from |lengths| (geodesic, rhumb or projected).
 *
 * Example: a polyline with alternating black and white spans:
 *
 * <pre>
 * GMSMutablePath *path;
 * NSArray *styles = @[[GMSStrokeStyle solidColor:[UIColor whiteColor]],
 *                     [GMSStrokeStyle solidColor:[UIColor blackColor]]];
 * NSArray *lengths = @[@100000, @50000];
 * polyline.path = path;
 * polyline.spans = GMSStyleSpans(path, styles, lengths, kGMSLengthRhumb);
 * </pre>
 */
FOUNDATION_EXPORT
NSArray<GMSStyleSpan *> *GMSStyleSpans(GMSPath *path,
                                       NSArray<GMSStrokeStyle *> *styles,
                                       NSArray<NSNumber *> *lengths,
                                       GMSLengthKind lengthKind);

/**
 * Similar to GMSStyleSpans(path, styles, lengths, lengthKind) but additionally takes an initial
 * length offset that will be skipped over relative to the |lengths| array.
 *
 * |lengthOffset| the length (e.g. in meters) that should be skipped initially from |lengths|.
 */
FOUNDATION_EXPORT
NSArray<GMSStyleSpan *> *GMSStyleSpansOffset(GMSPath *path,
                                             NSArray<GMSStrokeStyle *> *styles,
                                             NSArray<NSNumber *> *lengths,
                                             GMSLengthKind lengthKind,
                                             double lengthOffset);

/**@}*/

NS_ASSUME_NONNULL_END;

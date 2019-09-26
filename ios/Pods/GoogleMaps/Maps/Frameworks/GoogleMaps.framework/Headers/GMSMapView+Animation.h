//
//  GMSMapView+Animation.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import "GMSMapView.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * GMSMapView (Animation) offers several animation helper methods.
 *
 * During any animation, retrieving the camera position through the camera property on GMSMapView
 * returns an intermediate immutable GMSCameraPosition. This camera position will typically
 * represent the most recently drawn frame.
 */
@interface GMSMapView (Animation)

/** Animates the camera of this map to |cameraPosition|. */
- (void)animateToCameraPosition:(GMSCameraPosition *)cameraPosition;

/**
 * As animateToCameraPosition:, but changes only the location of the camera (i.e., from the current
 * location to |location|).
 */
- (void)animateToLocation:(CLLocationCoordinate2D)location;

/**
 * As animateToCameraPosition:, but changes only the zoom level of the camera.
 *
 * This value is clamped by [kGMSMinZoomLevel, kGMSMaxZoomLevel].
 */
- (void)animateToZoom:(float)zoom;

/**
 * As animateToCameraPosition:, but changes only the bearing of the camera (in degrees). Zero
 * indicates true north.
 */
- (void)animateToBearing:(CLLocationDirection)bearing;

/**
 * As animateToCameraPosition:, but changes only the viewing angle of the camera (in degrees). This
 * value will be clamped to a minimum of zero (i.e., facing straight down) and between 30 and 45
 * degrees towards the horizon, depending on the relative closeness to the earth.
 */
- (void)animateToViewingAngle:(double)viewingAngle;

/**
 * Applies |cameraUpdate| to the current camera, and then uses the result as per
 * animateToCameraPosition:.
 */
- (void)animateWithCameraUpdate:(GMSCameraUpdate *)cameraUpdate;

@end

NS_ASSUME_NONNULL_END

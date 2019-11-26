//
//  GMSPanoramaCamera.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>

#import "GMSOrientation.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * GMSPanoramaCamera is used to control the viewing direction of a GMSPanoramaView. It does not
 * contain information about which particular panorama should be displayed.
 */
@interface GMSPanoramaCamera : NSObject

/**
 * Designated initializer. Configures this GMSPanoramaCamera with |orientation|, |zoom| and |FOV|.
 * These values will be clamped to acceptable ranges.
 */
- (id)initWithOrientation:(GMSOrientation)orientation zoom:(float)zoom FOV:(double)FOV;

/**
 * Convenience constructor specifying heading and pitch as part of |orientation|, plus |zoom| and
 * default field of view (90 degrees).
 */
+ (instancetype)cameraWithOrientation:(GMSOrientation)orientation zoom:(float)zoom;

/**
 * Convenience constructor specifying |heading|, |pitch|, |zoom| with default field of view (90
 * degrees).
 */
+ (instancetype)cameraWithHeading:(CLLocationDirection)heading pitch:(double)pitch zoom:(float)zoom;

/**
 * Convenience constructor for GMSPanoramaCamera, specifying all camera properties with heading and
 * pitch as part of |orientation|.
 */
+ (instancetype)cameraWithOrientation:(GMSOrientation)orientation zoom:(float)zoom FOV:(double)FOV;

/**
 * Convenience constructor for GMSPanoramaCamera, specifying all camera properties.
 */
+ (instancetype)cameraWithHeading:(CLLocationDirection)heading
                            pitch:(double)pitch
                             zoom:(float)zoom
                              FOV:(double)FOV;

/**
 * The field of view (FOV) encompassed by the larger dimension (width or height) of the view in
 * degrees at zoom 1. This is clamped to the range [1, 160] degrees, and has a default value of 90.
 *
 * Lower FOV values produce a zooming in effect; larger FOV values produce an fisheye effect.
 *
 * Note: This is not the displayed FOV if zoom is anything other than 1.  User zoom gestures
 * control the zoom property, not this property.
 */
@property(nonatomic, readonly) double FOV;

/**
 * Adjusts the visible region of the screen.  A zoom of N will show the same area as the central
 * width/N height/N area of what is shown at zoom 1.
 *
 * Zoom is clamped to the implementation defined range [1, 5].
 */
@property(nonatomic, readonly) float zoom;

/**
 * The camera orientation, which groups together heading and pitch.
 */
@property(nonatomic, readonly) GMSOrientation orientation;

@end

NS_ASSUME_NONNULL_END

//
//  GMSOrientation.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>

/**
 * GMSOrientation is a tuple of heading and pitch used to control the viewing direction of a
 * GMSPanoramaCamera.
 */
typedef struct {
  /** The camera heading (horizontal angle) in degrees. */
  const CLLocationDirection heading;

  /**
   * The camera pitch (vertical angle), in degrees from the horizon. The |pitch| range is [-90,90],
   * although it is possible that not the full range is supported.
   */
  const double pitch;
} GMSOrientation;

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Returns a GMSOrientation with the given |heading| and |pitch|.
 *
 * @related GMSOrientation
 */
inline static GMSOrientation GMSOrientationMake(CLLocationDirection heading, double pitch) {
  GMSOrientation orientation = {heading, pitch};
  return orientation;
}

#ifdef __cplusplus
}
#endif

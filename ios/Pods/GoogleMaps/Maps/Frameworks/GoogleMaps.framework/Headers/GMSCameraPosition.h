//
//  GMSCameraPosition.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreGraphics/CoreGraphics.h>
#import <CoreLocation/CoreLocation.h>

NS_ASSUME_NONNULL_BEGIN

/**
* An immutable class that aggregates all camera position parameters.
 */
@interface GMSCameraPosition : NSObject<NSCopying, NSMutableCopying>

/**
 * Location on the Earth towards which the camera points.
 */
@property(nonatomic, readonly) CLLocationCoordinate2D target;

/**
 * Zoom level. Zoom uses an exponentional scale, where zoom 0 represents the entire world as a
 * 256 x 256 square. Each successive zoom level increases magnification by a factor of 2. So at
 * zoom level 1, the world is 512x512, and at zoom level 2, the entire world is 1024x1024.
 */
@property(nonatomic, readonly) float zoom;

/**
 * Bearing of the camera, in degrees clockwise from true north.
 */
@property(nonatomic, readonly) CLLocationDirection bearing;

/**
 * The angle, in degrees, of the camera from the nadir (directly facing the Earth). 0 is
 * straight down, 90 is parallel to the ground. Note that the maximum angle allowed is dependent
 * on the zoom. You can think of it as a series of line segments as a function of zoom, rather
 * than a step function. For zoom 16 and above, the maximum angle is 65 degrees. For zoom 10 and
 * below, the maximum angle is 30 degrees.
 */
@property(nonatomic, readonly) double viewingAngle;

/**
 * Designated initializer. Configures this GMSCameraPosition with all available camera properties.
 * Building a GMSCameraPosition via this initializer (or by the following convenience constructors)
 * will implicitly clamp camera values.
 *
 * @param target Location on the earth towards which the camera points.
 * @param zoom The zoom level near the center of the screen.
 * @param bearing Bearing of the camera in degrees clockwise from true north.
 * @param viewingAngle The angle, in degrees, of the camera angle from the nadir (directly facing
 *                     the Earth)
 */
- (instancetype)initWithTarget:(CLLocationCoordinate2D)target
                          zoom:(float)zoom
                       bearing:(CLLocationDirection)bearing
                  viewingAngle:(double)viewingAngle;

/**
 * Convenience initializer for GMSCameraPosition for a particular target and zoom level. This will
 * set the bearing and viewingAngle properties of this camera to zero defaults (i.e., directly
 * facing the Earth's surface, with the top of the screen pointing north).
 *
 * @param target Location on the earth towards which the camera points.
 * @param zoom The zoom level near the center of the screen.
 */
- (instancetype)initWithTarget:(CLLocationCoordinate2D)target zoom:(float)zoom;

/**
 * Convenience initializer for GMSCameraPosition for a particular latitidue, longitude and zoom
 * level. This will set the bearing and viewingAngle properties of this camera to zero defaults
 * (i.e., directly facing the Earth's surface, with the top of the screen pointing north).
 *
 * @param latitude The latitude component of the location towards which the camera points.
 * @param longitude The latitude component of the location towards which the camera points.
 * @param zoom The zoom level near the center of the screen.
 */
- (instancetype)initWithLatitude:(CLLocationDegrees)latitude
                       longitude:(CLLocationDegrees)longitude
                            zoom:(float)zoom;

/**
 * Convenience initializer for GMSCameraPosition, with latitude/longitude and all other camera
 * properties as per -initWithTarget:zoom:bearing:viewingAngle:.
 *
 * @param latitude The latitude component of the location towards which the camera points.
 * @param longitude The latitude component of the location towards which the camera points.
 * @param zoom The zoom level near the center of the screen.
 * @param bearing Bearing of the camera in degrees clockwise from true north.
 * @param viewingAngle The angle, in degrees, of the camera angle from the nadir (directly facing
 *                     the Earth)
 */
- (instancetype)initWithLatitude:(CLLocationDegrees)latitude
                       longitude:(CLLocationDegrees)longitude
                            zoom:(float)zoom
                         bearing:(CLLocationDirection)bearing
                    viewingAngle:(double)viewingAngle;

/**
 * Convenience constructor for GMSCameraPosition for a particular target and zoom level. This will
 * set the bearing and viewingAngle properties of this camera to zero defaults (i.e., directly
 * facing the Earth's surface, with the top of the screen pointing north).
 */
+ (instancetype)cameraWithTarget:(CLLocationCoordinate2D)target zoom:(float)zoom;

/**
 * Convenience constructor for GMSCameraPosition, as per cameraWithTarget:zoom:.
 */
+ (instancetype)cameraWithLatitude:(CLLocationDegrees)latitude
                         longitude:(CLLocationDegrees)longitude
                              zoom:(float)zoom;

/**
 * Convenience constructor for GMSCameraPosition, with all camera properties as per
 * initWithTarget:zoom:bearing:viewingAngle:.
 */
+ (instancetype)cameraWithTarget:(CLLocationCoordinate2D)target
                            zoom:(float)zoom
                         bearing:(CLLocationDirection)bearing
                    viewingAngle:(double)viewingAngle;

/**
 * Convenience constructor for GMSCameraPosition, with latitude/longitude and all other camera
 * properties as per initWithTarget:zoom:bearing:viewingAngle:.
 */
+ (instancetype)cameraWithLatitude:(CLLocationDegrees)latitude
                         longitude:(CLLocationDegrees)longitude
                              zoom:(float)zoom
                           bearing:(CLLocationDirection)bearing
                      viewingAngle:(double)viewingAngle;

/**
 * Get the zoom level at which |meters| distance, at given |coord| on Earth, correspond to the
 * specified number of screen |points|.
 *
 * For extremely large or small distances the returned zoom level may be smaller or larger than the
 * minimum or maximum zoom level allowed on the camera.
 *
 * This helper method is useful for building camera positions that contain specific physical areas
 * on Earth.
 */
+ (float)zoomAtCoordinate:(CLLocationCoordinate2D)coordinate
                forMeters:(CLLocationDistance)meters
                perPoints:(CGFloat)points;

@end

/** Mutable version of GMSCameraPosition. */
@interface GMSMutableCameraPosition : GMSCameraPosition
@property(nonatomic) CLLocationCoordinate2D target;
@property(nonatomic) float zoom;
@property(nonatomic) CLLocationDirection bearing;
@property(nonatomic) double viewingAngle;
@end

/** The maximum zoom (closest to the Earth's surface) permitted by the map camera. */
FOUNDATION_EXTERN const float kGMSMaxZoomLevel;

/** The minimum zoom (farthest from the Earth's surface) permitted by the map camera. */
FOUNDATION_EXTERN const float kGMSMinZoomLevel;

NS_ASSUME_NONNULL_END

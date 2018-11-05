//
//  GMSUISettings.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <Foundation/Foundation.h>

/** Settings for the user interface of a GMSMapView. */
@interface GMSUISettings : NSObject

/**
 * Sets the preference for whether all gestures should be enabled (default) or disabled. This
 * doesn't restrict users from tapping any on screen buttons to move the camera (e.g., compass or
 * zoom controls), nor does it restrict programmatic movements and animation.
 */
- (void)setAllGesturesEnabled:(BOOL)enabled;

/**
 * Controls whether scroll gestures are enabled (default) or disabled. If enabled, users may drag to
 * pan the camera. This does not limit programmatic movement of the camera.
 */
@property(nonatomic, assign) BOOL scrollGestures;

/**
 * Controls whether zoom gestures are enabled (default) or disabled. If enabled, users may double
 * tap/two-finger tap or pinch to zoom the camera. This does not limit programmatic movement of the
 * camera.
 */
@property(nonatomic, assign) BOOL zoomGestures;

/**
 * Controls whether tilt gestures are enabled (default) or disabled. If enabled, users may use a
 * two-finger vertical down or up swipe to tilt the camera. This does not limit programmatic control
 * of the camera's viewingAngle.
 */
@property(nonatomic, assign) BOOL tiltGestures;

/**
 * Controls whether rotate gestures are enabled (default) or disabled. If enabled, users may use a
 * two-finger rotate gesture to rotate the camera. This does not limit programmatic control of the
 * camera's bearing.
 */
@property(nonatomic, assign) BOOL rotateGestures;

/**
 * Controls whether gestures by users are completely consumed by the GMSMapView when gestures are
 * enabled (default YES).  This prevents these gestures from being received by parent views.
 *
 * When the GMSMapView is contained by a UIScrollView (or other scrollable area), this means that
 * gestures on the map will not be additional consumed as scroll gestures.  However, disabling this
 * (set to NO) may be useful to support complex view hierarchies or requirements.
 */
@property(nonatomic, assign) BOOL consumesGesturesInView;

/**
 * Enables or disables the compass. The compass is an icon on the map that indicates the direction
 * of north on the map.
 *
 * If enabled, it is only shown when the camera is rotated away from its default orientation
 * (bearing of 0). When a user taps the compass, the camera orients itself to its default
 * orientation and fades away shortly after. If disabled, the compass will never be displayed.
 */
@property(nonatomic, assign) BOOL compassButton;

/**
 * Enables or disables the My Location button. This is a button visible on the map that, when tapped
 * by users, will center the map on the current user location.
 */
@property(nonatomic, assign) BOOL myLocationButton;

/**
 * Enables (default) or disables the indoor floor picker.
 *
 * If enabled, it is only visible when the view is focused on a building with indoor floor data. If
 * disabled, the selected floor can still be controlled programmatically via the indoorDisplay
 * mapView property.
 */
@property(nonatomic, assign) BOOL indoorPicker;

/**
 * Controls whether rotate and zoom gestures can be performed off-center and scrolled around
 * (default YES).
 */
@property(nonatomic, assign) BOOL allowScrollGesturesDuringRotateOrZoom;

@end

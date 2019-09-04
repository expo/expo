//
//  GMSCameraUpdate.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>
#import <UIKit/UIKit.h>

@class GMSCameraPosition;
@class GMSCoordinateBounds;

NS_ASSUME_NONNULL_BEGIN

/**
 * GMSCameraUpdate represents an update that may be applied to a GMSMapView.
 *
 * It encapsulates some logic for modifying the current camera.
 *
 * It should only be constructed using the factory helper methods below.
 */
@interface GMSCameraUpdate : NSObject

/**
 * Returns a GMSCameraUpdate that zooms in on the map.
 *
 * The zoom increment is 1.0.
 */
+ (GMSCameraUpdate *)zoomIn;

/**
 * Returns a GMSCameraUpdate that zooms out on the map.
 *
 * The zoom increment is -1.0.
 */
+ (GMSCameraUpdate *)zoomOut;

/**
 * Returns a GMSCameraUpdate that changes the zoom by the specified amount.
 */
+ (GMSCameraUpdate *)zoomBy:(float)delta;

/**
 * Returns a GMSCameraUpdate that sets the zoom to the specified amount.
 */
+ (GMSCameraUpdate *)zoomTo:(float)zoom;

/**
 * Returns a GMSCameraUpdate that sets the camera target to the specified coordinate.
 */
+ (GMSCameraUpdate *)setTarget:(CLLocationCoordinate2D)target;

/**
 * Returns a GMSCameraUpdate that sets the camera target and zoom to the specified values.
 */
+ (GMSCameraUpdate *)setTarget:(CLLocationCoordinate2D)target zoom:(float)zoom;

/**
 * Returns a GMSCameraUpdate that sets the camera to the specified GMSCameraPosition.
 */
+ (GMSCameraUpdate *)setCamera:(GMSCameraPosition *)camera;

/**
 * Returns a GMSCameraUpdate that transforms the camera such that the specified bounds are centered
 * on screen at the greatest possible zoom level. The bounds will have a default padding of 64
 * points.
 *
 * The returned camera update will set the camera's bearing and tilt to their default zero values
 * (i.e., facing north and looking directly at the Earth).
 */
+ (GMSCameraUpdate *)fitBounds:(GMSCoordinateBounds *)bounds;

/**
 * This is similar to fitBounds: but allows specifying the padding (in points) in order to inset the
 * bounding box from the view's edges.
 *
 * If the requested |padding| is larger than the view size in either the vertical or horizontal
 * direction the map will be maximally zoomed out.
 */
+ (GMSCameraUpdate *)fitBounds:(GMSCoordinateBounds *)bounds withPadding:(CGFloat)padding;

/**
 * This is similar to fitBounds: but allows specifying edge insets in order to inset the bounding
 * box from the view's edges.
 *
 * If the requested |edgeInsets| are larger than the view size in either the vertical or horizontal
 * direction the map will be maximally zoomed out.
 */
+ (GMSCameraUpdate *)fitBounds:(GMSCoordinateBounds *)bounds
                withEdgeInsets:(UIEdgeInsets)edgeInsets;

/**
 * Returns a GMSCameraUpdate that shifts the center of the view by the specified number of points in
 * the x and y directions. X grows to the right, Y grows down.
 */
+ (GMSCameraUpdate *)scrollByX:(CGFloat)dX Y:(CGFloat)dY;

/**
 * Returns a GMSCameraUpdate that zooms with a focus point; the focus point stays fixed on screen.
 */
+ (GMSCameraUpdate *)zoomBy:(float)zoom atPoint:(CGPoint)point;

@end

NS_ASSUME_NONNULL_END

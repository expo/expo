//
//  GMSMarker.h
//  Google Maps SDK for iOS
//
//  Copyright 2012 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <UIKit/UIKit.h>

#import "GMSOverlay.h"

@class GMSMarkerLayer;
@class GMSPanoramaView;
@class UIImage;

NS_ASSUME_NONNULL_BEGIN

/**
 * \defgroup MarkerAnimation GMSMarkerAnimation
 * @{
 */

/**
 * Animation types for GMSMarker.
 */
typedef NS_ENUM(NSUInteger, GMSMarkerAnimation) {
  /** No animation (default). */
  kGMSMarkerAnimationNone = 0,

  /** The marker will pop from its groundAnchor when added. */
  kGMSMarkerAnimationPop,
};

/**@}*/

/**
 * A marker is an icon placed at a particular point on the map's surface. A marker's icon is drawn
 * oriented against the device's screen rather than the map's surface; i.e., it will not necessarily
 * change orientation due to map rotations, tilting, or zooming.
 */
@interface GMSMarker : GMSOverlay

/** Marker position. Animated. */
@property(nonatomic, assign) CLLocationCoordinate2D position;

/** Snippet text, shown beneath the title in the info window when selected. */
@property(nonatomic, copy, nullable) NSString *snippet;

/**
 * Marker icon to render. If left nil, uses a default SDK place marker.
 *
 * Supports animated images, but each frame must be the same size or the behavior is undefined.
 *
 * Supports the use of alignmentRectInsets to specify a reduced tap area.  This also redefines how
 * anchors are specified.  For an animated image the value for the animation is used, not the
 * individual frames.
 */
@property(nonatomic, strong, nullable) UIImage *icon;

/**
 * Marker view to render. If left nil, falls back to the |icon| property instead.
 *
 * Supports animation of all animatable properties of UIView, except |frame| and |center|. Changing
 * these properties or their corresponding CALayer version, including |position|, is not supported.
 *
 * Note that the view behaves as if |clipsToBounds| is set to YES, regardless of its actual value.
 */
@property(nonatomic, strong, nullable) UIView *iconView;

/**
 * Controls whether the icon for this marker should be redrawn every frame.
 *
 * Note that when this changes from NO to YES, the icon is guaranteed to be redrawn next frame.
 *
 * Defaults to YES.
 * Has no effect if |iconView| is nil.
 */
@property(nonatomic, assign) BOOL tracksViewChanges;

/**
 * Controls whether the info window for this marker should be redrawn every frame.
 *
 * Note that when this changes from NO to YES, the info window is guaranteed to be redrawn next
 * frame.
 *
 * Defaults to NO.
 */
@property(nonatomic, assign) BOOL tracksInfoWindowChanges;

/**
 * The ground anchor specifies the point in the icon image that is anchored to the marker's position
 * on the Earth's surface. This point is specified within the continuous space [0.0, 1.0] x [0.0,
 * 1.0], where (0,0) is the top-left corner of the image, and (1,1) is the bottom-right corner.
 *
 * If the image has non-zero alignmentRectInsets, the top-left and bottom-right mentioned above
 * refer to the inset section of the image.
 */
@property(nonatomic, assign) CGPoint groundAnchor;

/**
 * The info window anchor specifies the point in the icon image at which to anchor the info window,
 * which will be displayed directly above this point. This point is specified within the same space
 * as groundAnchor.
 */
@property(nonatomic, assign) CGPoint infoWindowAnchor;

/**
 * Controls the animation used when this marker is placed on a GMSMapView (default
 * kGMSMarkerAnimationNone, no animation).
 */
@property(nonatomic, assign) GMSMarkerAnimation appearAnimation;

/**
 * Controls whether this marker can be dragged interactively (default NO).
 */
@property(nonatomic, assign, getter=isDraggable) BOOL draggable;

/**
 * Controls whether this marker should be flat against the Earth's surface (YES) or a billboard
 * facing the camera (NO, default).
 */
@property(nonatomic, assign, getter=isFlat) BOOL flat;

/**
 * Sets the rotation of the marker in degrees clockwise about the marker's anchor point. The axis of
 * rotation is perpendicular to the marker. A rotation of 0 corresponds to the default position of
 * the marker. Animated.
 *
 * When the marker is flat on the map, the default position is north aligned and the rotation is
 * such that the marker always remains flat on the map. When the marker is a billboard, the default
 * position is pointing up and the rotation is such that the marker is always facing the camera.
 */
@property(nonatomic, assign) CLLocationDegrees rotation;

/**
 * Sets the opacity of the marker, between 0 (completely transparent) and 1 (default) inclusive.
 */
@property(nonatomic, assign) float opacity;

/**
 * Provides the Core Animation layer for this GMSMarker.
 */
@property(nonatomic, strong, readonly) GMSMarkerLayer *layer;

/**
 * The |panoramaView| specifies which panorama view will attempt to show this marker.  Note that if
 * the marker's |position| is too far away from the |panoramaView|'s current panorama location, it
 * will not be displayed as it will be too small.
 *
 * Can be set to nil to remove the marker from any current panorama view it is attached to.
 *
 * A marker can be shown on both a panorama and a map at the same time.
 */
@property(nonatomic, weak, nullable) GMSPanoramaView *panoramaView;

/** Convenience constructor for a default marker. */
+ (instancetype)markerWithPosition:(CLLocationCoordinate2D)position;

/** Creates a tinted version of the default marker image for use as an icon. */
+ (UIImage *)markerImageWithColor:(nullable UIColor *)color;

@end

/**
 * The default position of the ground anchor of a GMSMarker: the center bottom point of the marker
 * icon.
 */
FOUNDATION_EXTERN const CGPoint kGMSMarkerDefaultGroundAnchor;

/**
 * The default position of the info window anchor of a GMSMarker: the center top point of the marker
 * icon.
 */
FOUNDATION_EXTERN const CGPoint kGMSMarkerDefaultInfoWindowAnchor;

NS_ASSUME_NONNULL_END

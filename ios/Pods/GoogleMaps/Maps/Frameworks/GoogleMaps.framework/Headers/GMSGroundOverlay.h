//
//  GMSGroundOverlay.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <UIKit/UIKit.h>

#import "GMSOverlay.h"

@class GMSCoordinateBounds;

NS_ASSUME_NONNULL_BEGIN

/**
 * GMSGroundOverlay specifies the available options for a ground overlay that exists on the Earth's
 * surface. Unlike a marker, the position of a ground overlay is specified explicitly and it does
 * not face the camera.
 */
@interface GMSGroundOverlay : GMSOverlay

/**
 * The position of this GMSGroundOverlay, or more specifically, the physical position of its anchor.
 * If this is changed, |bounds| will be moved around the new position.
 */
@property(nonatomic) CLLocationCoordinate2D position;

/**
 * The anchor specifies where this GMSGroundOverlay is anchored to the Earth in relation to
 * |bounds|. If this is modified, |position| will be set to the corresponding new position within
 * |bounds|.
 */
@property(nonatomic) CGPoint anchor;

/**
 * Icon to render within |bounds| on the Earth. If this is nil, the overlay will not be visible
 * (unlike GMSMarker which has a default image).
 */
@property(nonatomic, nullable) UIImage *icon;

/**
 * Sets the opacity of the ground overlay, between 0 (completely transparent) and 1 (default)
 * inclusive.
 */
@property(nonatomic) float opacity;

/**
 * Bearing of this ground overlay, in degrees. The default value, zero, points this ground overlay
 * up/down along the normal Y axis of the earth.
 */
@property(nonatomic) CLLocationDirection bearing;

/**
 * The 2D bounds on the Earth in which |icon| is drawn. Changing this value will adjust |position|
 * accordingly.
 */
@property(nonatomic, nullable) GMSCoordinateBounds *bounds;

/**
 * Convenience constructor for GMSGroundOverlay for a particular |bounds| and |icon|. Will set
 * |position| accordingly.
 */
+ (instancetype)groundOverlayWithBounds:(nullable GMSCoordinateBounds *)bounds
                                   icon:(nullable UIImage *)icon;

/**
 * Constructs a GMSGroundOverlay that renders the given |icon| at |position|, as if the image's
 * actual size matches camera pixels at |zoomLevel|.
 */
+ (instancetype)groundOverlayWithPosition:(CLLocationCoordinate2D)position
                                     icon:(nullable UIImage *)icon
                                zoomLevel:(CGFloat)zoomLevel;

@end

/**
 * The default position of the ground anchor of a GMSGroundOverlay: the center point of the icon.
 */
FOUNDATION_EXTERN const CGPoint kGMSGroundOverlayDefaultAnchor;

NS_ASSUME_NONNULL_END

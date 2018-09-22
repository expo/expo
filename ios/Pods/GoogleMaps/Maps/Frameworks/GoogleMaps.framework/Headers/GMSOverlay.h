//
//  GMSOverlay.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>

NS_ASSUME_NONNULL_BEGIN;

@class GMSMapView;

/**
 * GMSOverlay is an abstract class that represents some overlay that may be attached to a specific
 * GMSMapView. It may not be instantiated directly; instead, instances of concrete overlay types
 * should be created directly (such as GMSMarker, GMSPolyline, and GMSPolygon).
 *
 * This supports the NSCopying protocol; [overlay_ copy] will return a copy of the overlay type, but
 * with |map| set to nil.
 */
@interface GMSOverlay : NSObject<NSCopying>

/**
 * Title, a short description of the overlay. Some overlays, such as markers, will display the title
 * on the map. The title is also the default accessibility text.
 */
@property(nonatomic, copy, nullable) NSString *title;

/**
 * The map this overlay is on. Setting this property will add the overlay to the map. Setting it to
 * nil removes this overlay from the map. An overlay may be active on at most one map at any given
 * time.
 */
@property(nonatomic, weak, nullable) GMSMapView *map;

/**
 * If this overlay should cause tap notifications. Some overlays, such as markers, will default to
 * being tappable.
 */
@property(nonatomic, assign, getter=isTappable) BOOL tappable;

/**
 * Higher |zIndex| value overlays will be drawn on top of lower |zIndex| value tile layers and
 * overlays.  Equal values result in undefined draw ordering.  Markers are an exception that
 * regardless of |zIndex|, they will always be drawn above tile layers and other non-marker
 * overlays; they are effectively considered to be in a separate z-index group compared to other
 * overlays.
 */
@property(nonatomic, assign) int zIndex;

/**
 * Overlay data. You can use this property to associate an arbitrary object with this overlay.
 * Google Maps SDK for iOS neither reads nor writes this property.
 *
 * Note that userData should not hold any strong references to any Maps objects, otherwise a retain
 * cycle may be created (preventing objects from being released).
 */
@property(nonatomic, strong, nullable) id userData;

@end

NS_ASSUME_NONNULL_END;

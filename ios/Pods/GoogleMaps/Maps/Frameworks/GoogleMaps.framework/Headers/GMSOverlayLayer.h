//
//  GMSOverlayLayer.h
//  Google Maps SDK for iOS
//
//  Copyright 2018 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>
#import <QuartzCore/QuartzCore.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * GMSOverlayLayer is a custom subclass of CALayer, and an abstract baseclass for GMSOverlay layers
 * that allow custom animations.
 *
 * Note that this CALayer or any subclass are never actually rendered directly, as GMSMapView is
 * provided entirely via an OpenGL layer. As such, adjustments or animations to 'default' properties
 * of CALayer will not have any effect.
 *
 * This is an implementation detail and it should not be instantiated directly.
 */
@interface GMSOverlayLayer : CALayer

@end

NS_ASSUME_NONNULL_END

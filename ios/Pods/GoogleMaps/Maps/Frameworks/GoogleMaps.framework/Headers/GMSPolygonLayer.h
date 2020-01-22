//
//  GMSPolygonLayer.h
//  Google Maps SDK for iOS
//
//  Copyright 2018 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>
#import <UIKit/UIKit.h>

#import "GMSOverlayLayer.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * GMSPolygonLayer is a subclass of GMSOverlayLayer, available on a per-polygon basis, that allows
 * animation of several properties of its associated GMSPolygon.
 *
 * Note that this CALayer is never actually rendered directly, as GMSMapView is provided entirely
 * via an OpenGL layer. As such, adjustments or animations to 'default' properties of CALayer will
 * not have any effect.
 */
@interface GMSPolygonLayer : GMSOverlayLayer

/** The width of the polygon outline in screen points. */
@property(nonatomic) CGFloat strokeWidth;

/**
 * The color of the polygon outline. This is an assign property, there is an expectation for the
 * GMSPolygon to own the reference if necessary.
 */
@property(nonatomic, assign, nullable) CGColorRef strokeColor;

/**
 * The fill color. This is an assign property, there is an expectation for the GMSPolygon to own the
 * reference if necessary.
 */
@property(nonatomic, assign, nullable) CGColorRef fillColor;

@end

extern NSString *const kGMSPolygonLayerStrokeWidth;
extern NSString *const kGMSPolygonLayerStrokeColor;
extern NSString *const kGMSPolygonLayerFillColor;

NS_ASSUME_NONNULL_END

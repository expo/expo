//
//  GMSPanoramaCameraUpdate.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * GMSPanoramaCameraUpdate represents an update that may be applied to a GMSPanoramaView.
 * It encapsulates some logic for modifying the current camera.
 * It should only be constructed using the factory helper methods below.
 */
@interface GMSPanoramaCameraUpdate : NSObject

/** Returns an update that increments the camera heading with |deltaHeading|. */
+ (GMSPanoramaCameraUpdate *)rotateBy:(CGFloat)deltaHeading;

/** Returns an update that sets the camera heading to the given value. */
+ (GMSPanoramaCameraUpdate *)setHeading:(CGFloat)heading;

/** Returns an update that sets the camera pitch to the given value. */
+ (GMSPanoramaCameraUpdate *)setPitch:(CGFloat)pitch;

/** Returns an update that sets the camera zoom to the given value. */
+ (GMSPanoramaCameraUpdate *)setZoom:(CGFloat)zoom;

@end

NS_ASSUME_NONNULL_END

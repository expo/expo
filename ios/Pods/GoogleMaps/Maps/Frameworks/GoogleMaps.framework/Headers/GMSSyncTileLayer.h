//
//  GMSSyncTileLayer.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <Foundation/Foundation.h>

#import "GMSTileLayer.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * GMSSyncTileLayer is an abstract subclass of GMSTileLayer that provides a sync interface to
 * generate image tile data.
 */
@interface GMSSyncTileLayer : GMSTileLayer

/**
 * As per requestTileForX:y:zoom:receiver: on GMSTileLayer, but provides a synchronous interface to
 * return tiles. This method may block or otherwise perform work, and is not called on the main
 * thread.
 *
 * Calls to this method may also be made from multiple threads so implementations must be
 * threadsafe.
 */
- (nullable UIImage *)tileForX:(NSUInteger)x y:(NSUInteger)y zoom:(NSUInteger)zoom;

@end

NS_ASSUME_NONNULL_END

//
//  GMSTileLayer.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <UIKit/UIKit.h>

@class GMSMapView;

NS_ASSUME_NONNULL_BEGIN

/**
 * Stub tile that is used to indicate that no tile exists for a specific tile coordinate. May be
 * returned by tileForX:y:zoom: on GMSTileProvider.
 */
FOUNDATION_EXTERN UIImage *const kGMSTileLayerNoTile;

/**
 * GMSTileReceiver is provided to GMSTileLayer when a tile request is made, allowing the callback to
 * be later (or immediately) invoked.
 */
@protocol GMSTileReceiver<NSObject>
- (void)receiveTileWithX:(NSUInteger)x
                       y:(NSUInteger)y
                    zoom:(NSUInteger)zoom
                   image:(nullable UIImage *)image;
@end

/**
 * GMSTileLayer is an abstract class that allows overlaying of custom image tiles on a specified
 * GMSMapView. It may not be initialized directly, and subclasses must implement the
 * tileForX:y:zoom: method to return tiles.
 *
 * At zoom level 0 the whole world is a square covered by a single tile, and the coordinates |x| and
 * |y| are both 0 for that tile. At zoom level 1, the world is covered by 4 tiles with |x| and |y|
 * being 0 or 1, and so on.
 */
@interface GMSTileLayer : NSObject

/**
 * requestTileForX:y:zoom:receiver: generates image tiles for GMSTileOverlay. It must be overridden
 * by subclasses. The tile for the given |x|, |y| and |zoom| _must_ be later passed to |receiver|.
 *
 * Specify kGMSTileLayerNoTile if no tile is available for this location; or nil if a transient
 * error occured and a tile may be available later.
 *
 * Calls to this method will be made on the main thread. See GMSSyncTileLayer for a base class that
 * implements a blocking tile layer that does not run on your application's main thread.
 */
- (void)requestTileForX:(NSUInteger)x
                      y:(NSUInteger)y
                   zoom:(NSUInteger)zoom
               receiver:(id<GMSTileReceiver>)receiver;

/**
 * Clears the cache so that all tiles will be requested again.
 */
- (void)clearTileCache;

/**
 * The map this GMSTileOverlay is displayed on. Setting this property will add the layer to the map.
 * Setting it to nil removes this layer from the map. A layer may be active on at most one map at
 * any given time.
 */
@property(nonatomic, weak, nullable) GMSMapView *map;

/**
 * Higher |zIndex| value tile layers will be drawn on top of lower |zIndex| value tile layers and
 * overlays. Equal values result in undefined draw ordering.
 */
@property(nonatomic, assign) int zIndex;

/**
 * Specifies the number of pixels (not points) that the returned tile images will prefer to display
 * as. For best results, this should be the edge length of your custom tiles. Defaults to 256, which
 * is the traditional size of Google Maps tiles.
 *
 * Values less than the equivalent of 128 points (e.g. 256 pixels on retina devices) may not perform
 * well and are not recommended.
 *
 * As an example, an application developer may wish to provide retina tiles (512 pixel edge length)
 * on retina devices, to keep the same number of tiles
 * per view as the default value of 256 would give on a non-retina device.
 */
@property(nonatomic, assign) NSInteger tileSize;

/**
 * Specifies the opacity of the tile layer. This provides a multiplier for the alpha channel of tile
 * images.
 */
@property(nonatomic, assign) float opacity;

/**
 * Specifies whether the tiles should fade in. Default YES.
 */
@property(nonatomic, assign) BOOL fadeIn;

@end

NS_ASSUME_NONNULL_END

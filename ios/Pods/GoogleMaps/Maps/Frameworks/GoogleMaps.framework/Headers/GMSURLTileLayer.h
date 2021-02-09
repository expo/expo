//
//  GMSURLTileLayer.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import "GMSTileLayer.h"

@class NSURL;

NS_ASSUME_NONNULL_BEGIN

/**
 * |GMSTileURLConstructor| is a block taking |x|, |y| and |zoom| and returning an NSURL, or nil to
 * indicate no tile for that location.
 *
 * @related GMSURLTileLayer
 */
typedef NSURL *_Nullable (^GMSTileURLConstructor)(NSUInteger x, NSUInteger y, NSUInteger zoom);

/**
 * GMSURLTileProvider fetches tiles based on the URLs returned from a GMSTileURLConstructor. For
 * example:
 * <pre>
 *   GMSTileURLConstructor constructor = ^(NSUInteger x, NSUInteger y, NSUInteger zoom) {
 *     NSString *URLStr =
 *         [NSString stringWithFormat:@"https://example.com/%d/%d/%d.png", x, y, zoom];
 *     return [NSURL URLWithString:URLStr];
 *   };
 *   GMSTileLayer *layer =
 *       [GMSURLTileLayer tileLayerWithURLConstructor:constructor];
 *   layer.userAgent = @"SDK user agent";
 *   layer.map = map;
 * </pre>
 *
 * GMSURLTileProvider may not be subclassed and should only be created via its convenience
 * constructor.
 */
@interface GMSURLTileLayer : GMSTileLayer

/** Convenience constructor. |constructor| must be non-nil. */
+ (instancetype)tileLayerWithURLConstructor:(GMSTileURLConstructor)constructor;

/**
 * Specify the user agent to describe your application. If this is nil (the default), the default
 * iOS user agent is used for HTTP requests.
 */
@property(nonatomic, copy, nullable) NSString *userAgent;

@end

NS_ASSUME_NONNULL_END

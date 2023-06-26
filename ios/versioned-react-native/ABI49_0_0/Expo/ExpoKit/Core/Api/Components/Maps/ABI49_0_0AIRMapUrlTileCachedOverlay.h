//
//  ABI49_0_0AIRMapUrlTileCachedOverlay.h
//  Airmaps
//
//  Created by Markus Suomi on 10/04/2021.
//

#import <MapKit/MapKit.h>

@interface ABI49_0_0AIRMapUrlTileCachedOverlay : MKTileOverlay

@property NSInteger maximumNativeZ;
@property (nonatomic, copy) NSURL *tileCachePath;
@property NSInteger tileCacheMaxAge;
@property BOOL offlineMode;

@end

//
//  ABI49_0_0AIRMapWMSTile.h
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <Foundation/Foundation.h>
#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTComponent.h>
#import <ABI49_0_0React/ABI49_0_0RCTView.h>
#import "ABI49_0_0AIRMapCoordinate.h"
#import "ABI49_0_0AIRMap.h"
#import "ABI49_0_0RCTConvert+AirMap.h"
#import "ABI49_0_0AIRMapUrlTile.h"
#import "ABI49_0_0AIRMapUrlTileCachedOverlay.h"

@interface ABI49_0_0AIRMapWMSTile : ABI49_0_0AIRMapUrlTile <MKOverlay>
@end

@interface ABI49_0_0AIRMapWMSTileOverlay : MKTileOverlay
@end

@interface ABI49_0_0AIRMapWMSTileCachedOverlay : ABI49_0_0AIRMapUrlTileCachedOverlay
@end

@interface ABI49_0_0AIRMapWMSTileHelper : NSObject

+ (NSURL *)URLForTilePath:(MKTileOverlayPath)path withURLTemplate:(NSString *)URLTemplate withTileSize:(NSInteger)tileSize;

@end

//
//  AIRMapWMSTile.h
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <Foundation/Foundation.h>
#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import <React/RCTComponent.h>
#import <React/RCTView.h>
#import "AIRMapCoordinate.h"
#import "AIRMap.h"
#import "RCTConvert+AirMap.h"
#import "AIRMapUrlTile.h"
#import "AIRMapUrlTileCachedOverlay.h"

@interface AIRMapWMSTile : AIRMapUrlTile <MKOverlay>
@end

@interface AIRMapWMSTileOverlay : MKTileOverlay
@end

@interface AIRMapWMSTileCachedOverlay : AIRMapUrlTileCachedOverlay
@end

@interface AIRMapWMSTileHelper : NSObject

+ (NSURL *)URLForTilePath:(MKTileOverlayPath)path withURLTemplate:(NSString *)URLTemplate withTileSize:(NSInteger)tileSize;

@end

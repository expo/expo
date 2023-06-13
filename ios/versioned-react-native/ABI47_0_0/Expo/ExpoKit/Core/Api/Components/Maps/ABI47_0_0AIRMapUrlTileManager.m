//
//  ABI47_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert+CoreLocation.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcher.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>
#import "ABI47_0_0AIRMapMarker.h"
#import "ABI47_0_0AIRMapUrlTile.h"

#import "ABI47_0_0AIRMapUrlTileManager.h"

@interface ABI47_0_0AIRMapUrlTileManager()

@end

@implementation ABI47_0_0AIRMapUrlTileManager


ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI47_0_0AIRMapUrlTile *tile = [ABI47_0_0AIRMapUrlTile new];
    return tile;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maximumNativeZ, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tileCachePath, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tileCacheMaxAge, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(offlineMode, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)

@end

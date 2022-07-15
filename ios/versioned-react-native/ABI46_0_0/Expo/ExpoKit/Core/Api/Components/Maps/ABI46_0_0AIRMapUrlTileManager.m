//
//  ABI46_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTConvert.h>
#import <ABI46_0_0React/ABI46_0_0RCTConvert+CoreLocation.h>
#import <ABI46_0_0React/ABI46_0_0RCTEventDispatcher.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>
#import <ABI46_0_0React/ABI46_0_0UIView+React.h>
#import "ABI46_0_0AIRMapMarker.h"
#import "ABI46_0_0AIRMapUrlTile.h"

#import "ABI46_0_0AIRMapUrlTileManager.h"

@interface ABI46_0_0AIRMapUrlTileManager()

@end

@implementation ABI46_0_0AIRMapUrlTileManager


ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI46_0_0AIRMapUrlTile *tile = [ABI46_0_0AIRMapUrlTile new];
    return tile;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maximumNativeZ, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(tileCachePath, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(tileCacheMaxAge, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(offlineMode, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)

@end

//
//  ABI45_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>
#import <ABI45_0_0React/ABI45_0_0RCTConvert.h>
#import <ABI45_0_0React/ABI45_0_0RCTConvert+CoreLocation.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventDispatcher.h>
#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>
#import "ABI45_0_0AIRMapMarker.h"
#import "ABI45_0_0AIRMapUrlTile.h"

#import "ABI45_0_0AIRMapUrlTileManager.h"

@interface ABI45_0_0AIRMapUrlTileManager()

@end

@implementation ABI45_0_0AIRMapUrlTileManager


ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI45_0_0AIRMapUrlTile *tile = [ABI45_0_0AIRMapUrlTile new];
    return tile;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maximumNativeZ, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tileCachePath, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tileCacheMaxAge, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(offlineMode, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)

@end

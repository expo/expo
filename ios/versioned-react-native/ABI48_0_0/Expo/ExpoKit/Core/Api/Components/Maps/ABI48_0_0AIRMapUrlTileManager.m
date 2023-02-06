//
//  ABI48_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert+CoreLocation.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventDispatcher.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>
#import "ABI48_0_0AIRMapMarker.h"
#import "ABI48_0_0AIRMapUrlTile.h"

#import "ABI48_0_0AIRMapUrlTileManager.h"

@interface ABI48_0_0AIRMapUrlTileManager()

@end

@implementation ABI48_0_0AIRMapUrlTileManager


ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI48_0_0AIRMapUrlTile *tile = [ABI48_0_0AIRMapUrlTile new];
    return tile;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maximumNativeZ, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tileCachePath, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tileCacheMaxAge, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(offlineMode, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)

@end

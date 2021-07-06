//
//  ABI40_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>
#import <ABI40_0_0React/ABI40_0_0RCTConvert+CoreLocation.h>
#import <ABI40_0_0React/ABI40_0_0RCTEventDispatcher.h>
#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>
#import <ABI40_0_0React/ABI40_0_0UIView+React.h>
#import "ABI40_0_0AIRMapMarker.h"
#import "ABI40_0_0AIRMapUrlTile.h"

#import "ABI40_0_0AIRMapUrlTileManager.h"

@interface ABI40_0_0AIRMapUrlTileManager()

@end

@implementation ABI40_0_0AIRMapUrlTileManager


ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI40_0_0AIRMapUrlTile *tile = [ABI40_0_0AIRMapUrlTile new];
    return tile;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

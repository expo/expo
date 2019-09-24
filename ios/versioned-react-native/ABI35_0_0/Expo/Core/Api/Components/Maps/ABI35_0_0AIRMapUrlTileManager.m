//
//  ABI35_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI35_0_0/ABI35_0_0RCTBridge.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert+CoreLocation.h>
#import <ReactABI35_0_0/ABI35_0_0RCTEventDispatcher.h>
#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>
#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>
#import "ABI35_0_0AIRMapMarker.h"
#import "ABI35_0_0AIRMapUrlTile.h"

#import "ABI35_0_0AIRMapUrlTileManager.h"

@interface ABI35_0_0AIRMapUrlTileManager()

@end

@implementation ABI35_0_0AIRMapUrlTileManager


ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI35_0_0AIRMapUrlTile *tile = [ABI35_0_0AIRMapUrlTile new];
    return tile;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

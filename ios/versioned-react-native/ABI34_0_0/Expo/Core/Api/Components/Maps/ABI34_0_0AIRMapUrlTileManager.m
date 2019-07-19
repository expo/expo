//
//  ABI34_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI34_0_0/ABI34_0_0RCTBridge.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert+CoreLocation.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventDispatcher.h>
#import <ReactABI34_0_0/ABI34_0_0RCTViewManager.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>
#import "ABI34_0_0AIRMapMarker.h"
#import "ABI34_0_0AIRMapUrlTile.h"

#import "ABI34_0_0AIRMapUrlTileManager.h"

@interface ABI34_0_0AIRMapUrlTileManager()

@end

@implementation ABI34_0_0AIRMapUrlTileManager


ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI34_0_0AIRMapUrlTile *tile = [ABI34_0_0AIRMapUrlTile new];
    return tile;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

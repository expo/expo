//
//  ABI32_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>
#import <ReactABI32_0_0/ABI32_0_0RCTConvert.h>
#import <ReactABI32_0_0/ABI32_0_0RCTConvert+CoreLocation.h>
#import <ReactABI32_0_0/ABI32_0_0RCTEventDispatcher.h>
#import <ReactABI32_0_0/ABI32_0_0RCTViewManager.h>
#import <ReactABI32_0_0/UIView+ReactABI32_0_0.h>
#import "ABI32_0_0AIRMapMarker.h"
#import "ABI32_0_0AIRMapUrlTile.h"

#import "ABI32_0_0AIRMapUrlTileManager.h"

@interface ABI32_0_0AIRMapUrlTileManager()

@end

@implementation ABI32_0_0AIRMapUrlTileManager


ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI32_0_0AIRMapUrlTile *tile = [ABI32_0_0AIRMapUrlTile new];
    return tile;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)

@end

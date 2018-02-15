//
//  ABI26_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert+CoreLocation.h>
#import <ReactABI26_0_0/ABI26_0_0RCTEventDispatcher.h>
#import <ReactABI26_0_0/ABI26_0_0RCTViewManager.h>
#import <ReactABI26_0_0/UIView+ReactABI26_0_0.h>
#import "ABI26_0_0AIRMapMarker.h"
#import "ABI26_0_0AIRMapUrlTile.h"

#import "ABI26_0_0AIRMapUrlTileManager.h"

@interface ABI26_0_0AIRMapUrlTileManager()

@end

@implementation ABI26_0_0AIRMapUrlTileManager


ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI26_0_0AIRMapUrlTile *tile = [ABI26_0_0AIRMapUrlTile new];
    return tile;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)

@end

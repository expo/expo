//
//  ABI28_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert+CoreLocation.h>
#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>
#import <ReactABI28_0_0/ABI28_0_0RCTViewManager.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>
#import "ABI28_0_0AIRMapMarker.h"
#import "ABI28_0_0AIRMapUrlTile.h"

#import "ABI28_0_0AIRMapUrlTileManager.h"

@interface ABI28_0_0AIRMapUrlTileManager()

@end

@implementation ABI28_0_0AIRMapUrlTileManager


ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI28_0_0AIRMapUrlTile *tile = [ABI28_0_0AIRMapUrlTile new];
    return tile;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)

@end

//
//  ABI30_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert+CoreLocation.h>
#import <ReactABI30_0_0/ABI30_0_0RCTEventDispatcher.h>
#import <ReactABI30_0_0/ABI30_0_0RCTViewManager.h>
#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>
#import "ABI30_0_0AIRMapMarker.h"
#import "ABI30_0_0AIRMapUrlTile.h"

#import "ABI30_0_0AIRMapUrlTileManager.h"

@interface ABI30_0_0AIRMapUrlTileManager()

@end

@implementation ABI30_0_0AIRMapUrlTileManager


ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI30_0_0AIRMapUrlTile *tile = [ABI30_0_0AIRMapUrlTile new];
    return tile;
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)

@end

//
//  ABI27_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/ABI27_0_0RCTConvert.h>
#import <ReactABI27_0_0/ABI27_0_0RCTConvert+CoreLocation.h>
#import <ReactABI27_0_0/ABI27_0_0RCTEventDispatcher.h>
#import <ReactABI27_0_0/ABI27_0_0RCTViewManager.h>
#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>
#import "ABI27_0_0AIRMapMarker.h"
#import "ABI27_0_0AIRMapUrlTile.h"

#import "ABI27_0_0AIRMapUrlTileManager.h"

@interface ABI27_0_0AIRMapUrlTileManager()

@end

@implementation ABI27_0_0AIRMapUrlTileManager


ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI27_0_0AIRMapUrlTile *tile = [ABI27_0_0AIRMapUrlTile new];
    return tile;
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)

@end

//
//  ABI20_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert+CoreLocation.h>
#import <ReactABI20_0_0/ABI20_0_0RCTEventDispatcher.h>
#import <ReactABI20_0_0/ABI20_0_0RCTViewManager.h>
#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>
#import "ABI20_0_0AIRMapMarker.h"
#import "ABI20_0_0AIRMapUrlTile.h"

#import "ABI20_0_0AIRMapUrlTileManager.h"

@interface ABI20_0_0AIRMapUrlTileManager()

@end

@implementation ABI20_0_0AIRMapUrlTileManager


ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI20_0_0AIRMapUrlTile *tile = [ABI20_0_0AIRMapUrlTile new];
    return tile;
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)

@end

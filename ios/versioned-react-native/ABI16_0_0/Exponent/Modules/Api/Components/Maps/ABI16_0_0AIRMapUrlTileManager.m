//
//  ABI16_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI16_0_0/ABI16_0_0RCTBridge.h>
#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>
#import <ReactABI16_0_0/ABI16_0_0RCTConvert+CoreLocation.h>
#import <ReactABI16_0_0/ABI16_0_0RCTEventDispatcher.h>
#import <ReactABI16_0_0/ABI16_0_0RCTViewManager.h>
#import <ReactABI16_0_0/UIView+ReactABI16_0_0.h>
#import "ABI16_0_0AIRMapMarker.h"
#import "ABI16_0_0AIRMapUrlTile.h"

#import "ABI16_0_0AIRMapUrlTileManager.h"

@interface ABI16_0_0AIRMapUrlTileManager()

@end

@implementation ABI16_0_0AIRMapUrlTileManager


ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI16_0_0AIRMapUrlTile *tile = [ABI16_0_0AIRMapUrlTile new];
    return tile;
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)

@end

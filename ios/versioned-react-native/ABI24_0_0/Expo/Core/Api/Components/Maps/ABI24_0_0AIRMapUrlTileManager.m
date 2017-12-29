//
//  ABI24_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert+CoreLocation.h>
#import <ReactABI24_0_0/ABI24_0_0RCTEventDispatcher.h>
#import <ReactABI24_0_0/ABI24_0_0RCTViewManager.h>
#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>
#import "ABI24_0_0AIRMapMarker.h"
#import "ABI24_0_0AIRMapUrlTile.h"

#import "ABI24_0_0AIRMapUrlTileManager.h"

@interface ABI24_0_0AIRMapUrlTileManager()

@end

@implementation ABI24_0_0AIRMapUrlTileManager


ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI24_0_0AIRMapUrlTile *tile = [ABI24_0_0AIRMapUrlTile new];
    return tile;
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)

@end

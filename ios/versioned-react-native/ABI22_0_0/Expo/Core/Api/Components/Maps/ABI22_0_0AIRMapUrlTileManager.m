//
//  ABI22_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert+CoreLocation.h>
#import <ReactABI22_0_0/ABI22_0_0RCTEventDispatcher.h>
#import <ReactABI22_0_0/ABI22_0_0RCTViewManager.h>
#import <ReactABI22_0_0/UIView+ReactABI22_0_0.h>
#import "ABI22_0_0AIRMapMarker.h"
#import "ABI22_0_0AIRMapUrlTile.h"

#import "ABI22_0_0AIRMapUrlTileManager.h"

@interface ABI22_0_0AIRMapUrlTileManager()

@end

@implementation ABI22_0_0AIRMapUrlTileManager


ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI22_0_0AIRMapUrlTile *tile = [ABI22_0_0AIRMapUrlTile new];
    return tile;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)

@end

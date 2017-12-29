//
//  ABI23_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert+CoreLocation.h>
#import <ReactABI23_0_0/ABI23_0_0RCTEventDispatcher.h>
#import <ReactABI23_0_0/ABI23_0_0RCTViewManager.h>
#import <ReactABI23_0_0/UIView+ReactABI23_0_0.h>
#import "ABI23_0_0AIRMapMarker.h"
#import "ABI23_0_0AIRMapUrlTile.h"

#import "ABI23_0_0AIRMapUrlTileManager.h"

@interface ABI23_0_0AIRMapUrlTileManager()

@end

@implementation ABI23_0_0AIRMapUrlTileManager


ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI23_0_0AIRMapUrlTile *tile = [ABI23_0_0AIRMapUrlTile new];
    return tile;
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)

@end

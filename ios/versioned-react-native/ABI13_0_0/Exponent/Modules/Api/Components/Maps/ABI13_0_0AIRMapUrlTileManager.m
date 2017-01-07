//
//  ABI13_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI13_0_0/ABI13_0_0RCTBridge.h>
#import <ReactABI13_0_0/ABI13_0_0RCTConvert.h>
#import <ReactABI13_0_0/ABI13_0_0RCTConvert+CoreLocation.h>
#import <ReactABI13_0_0/ABI13_0_0RCTEventDispatcher.h>
#import <ReactABI13_0_0/ABI13_0_0RCTViewManager.h>
#import <ReactABI13_0_0/UIView+ReactABI13_0_0.h>
#import "ABI13_0_0AIRMapMarker.h"
#import "ABI13_0_0AIRMapUrlTile.h"

#import "ABI13_0_0AIRMapUrlTileManager.h"

@interface ABI13_0_0AIRMapUrlTileManager()

@end

@implementation ABI13_0_0AIRMapUrlTileManager


ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI13_0_0AIRMapUrlTile *tile = [ABI13_0_0AIRMapUrlTile new];
    return tile;
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)

@end

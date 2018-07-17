//
//  ABI29_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert+CoreLocation.h>
#import <ReactABI29_0_0/ABI29_0_0RCTEventDispatcher.h>
#import <ReactABI29_0_0/ABI29_0_0RCTViewManager.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>
#import "ABI29_0_0AIRMapMarker.h"
#import "ABI29_0_0AIRMapUrlTile.h"

#import "ABI29_0_0AIRMapUrlTileManager.h"

@interface ABI29_0_0AIRMapUrlTileManager()

@end

@implementation ABI29_0_0AIRMapUrlTileManager


ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI29_0_0AIRMapUrlTile *tile = [ABI29_0_0AIRMapUrlTile new];
    return tile;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)

@end

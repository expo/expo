//
//  ABI29_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert+CoreLocation.h>
#import <ReactABI29_0_0/ABI29_0_0RCTEventDispatcher.h>
#import <ReactABI29_0_0/ABI29_0_0RCTViewManager.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>
#import "ABI29_0_0AIRMapMarker.h"
#import "ABI29_0_0AIRMapLocalTile.h"

#import "ABI29_0_0AIRMapLocalTileManager.h"

@interface ABI29_0_0AIRMapLocalTileManager()

@end

@implementation ABI29_0_0AIRMapLocalTileManager


ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI29_0_0AIRMapLocalTile *tile = [ABI29_0_0AIRMapLocalTile new];
    return tile;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

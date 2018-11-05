//
//  ABI28_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert+CoreLocation.h>
#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>
#import <ReactABI28_0_0/ABI28_0_0RCTViewManager.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>
#import "ABI28_0_0AIRMapMarker.h"
#import "ABI28_0_0AIRMapLocalTile.h"

#import "ABI28_0_0AIRMapLocalTileManager.h"

@interface ABI28_0_0AIRMapLocalTileManager()

@end

@implementation ABI28_0_0AIRMapLocalTileManager


ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI28_0_0AIRMapLocalTile *tile = [ABI28_0_0AIRMapLocalTile new];
    return tile;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

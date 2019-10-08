//
//  ABI35_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ReactABI35_0_0/ABI35_0_0RCTBridge.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert+CoreLocation.h>
#import <ReactABI35_0_0/ABI35_0_0RCTEventDispatcher.h>
#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>
#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>
#import "ABI35_0_0AIRMapMarker.h"
#import "ABI35_0_0AIRMapLocalTile.h"

#import "ABI35_0_0AIRMapLocalTileManager.h"

@interface ABI35_0_0AIRMapLocalTileManager()

@end

@implementation ABI35_0_0AIRMapLocalTileManager


ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI35_0_0AIRMapLocalTile *tile = [ABI35_0_0AIRMapLocalTile new];
    return tile;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

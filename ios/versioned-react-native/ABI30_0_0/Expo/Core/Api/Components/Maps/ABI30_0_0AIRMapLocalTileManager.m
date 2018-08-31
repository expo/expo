//
//  ABI30_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert+CoreLocation.h>
#import <ReactABI30_0_0/ABI30_0_0RCTEventDispatcher.h>
#import <ReactABI30_0_0/ABI30_0_0RCTViewManager.h>
#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>
#import "ABI30_0_0AIRMapMarker.h"
#import "ABI30_0_0AIRMapLocalTile.h"

#import "ABI30_0_0AIRMapLocalTileManager.h"

@interface ABI30_0_0AIRMapLocalTileManager()

@end

@implementation ABI30_0_0AIRMapLocalTileManager


ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI30_0_0AIRMapLocalTile *tile = [ABI30_0_0AIRMapLocalTile new];
    return tile;
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

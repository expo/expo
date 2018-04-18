//
//  ABI27_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/ABI27_0_0RCTConvert.h>
#import <ReactABI27_0_0/ABI27_0_0RCTConvert+CoreLocation.h>
#import <ReactABI27_0_0/ABI27_0_0RCTEventDispatcher.h>
#import <ReactABI27_0_0/ABI27_0_0RCTViewManager.h>
#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>
#import "ABI27_0_0AIRMapMarker.h"
#import "ABI27_0_0AIRMapLocalTile.h"

#import "ABI27_0_0AIRMapLocalTileManager.h"

@interface ABI27_0_0AIRMapLocalTileManager()

@end

@implementation ABI27_0_0AIRMapLocalTileManager


ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI27_0_0AIRMapLocalTile *tile = [ABI27_0_0AIRMapLocalTile new];
    return tile;
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

//
//  ABI33_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert+CoreLocation.h>
#import <ReactABI33_0_0/ABI33_0_0RCTEventDispatcher.h>
#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>
#import "ABI33_0_0AIRMapMarker.h"
#import "ABI33_0_0AIRMapLocalTile.h"

#import "ABI33_0_0AIRMapLocalTileManager.h"

@interface ABI33_0_0AIRMapLocalTileManager()

@end

@implementation ABI33_0_0AIRMapLocalTileManager


ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI33_0_0AIRMapLocalTile *tile = [ABI33_0_0AIRMapLocalTile new];
    return tile;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

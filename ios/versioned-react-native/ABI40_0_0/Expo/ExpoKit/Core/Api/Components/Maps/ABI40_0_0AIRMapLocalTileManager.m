//
//  ABI40_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>
#import <ABI40_0_0React/ABI40_0_0RCTConvert+CoreLocation.h>
#import <ABI40_0_0React/ABI40_0_0RCTEventDispatcher.h>
#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>
#import <ABI40_0_0React/ABI40_0_0UIView+React.h>
#import "ABI40_0_0AIRMapMarker.h"
#import "ABI40_0_0AIRMapLocalTile.h"

#import "ABI40_0_0AIRMapLocalTileManager.h"

@interface ABI40_0_0AIRMapLocalTileManager()

@end

@implementation ABI40_0_0AIRMapLocalTileManager


ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI40_0_0AIRMapLocalTile *tile = [ABI40_0_0AIRMapLocalTile new];
    return tile;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

//
//  ABI47_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert+CoreLocation.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcher.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>
#import "ABI47_0_0AIRMapMarker.h"
#import "ABI47_0_0AIRMapLocalTile.h"

#import "ABI47_0_0AIRMapLocalTileManager.h"

@interface ABI47_0_0AIRMapLocalTileManager()

@end

@implementation ABI47_0_0AIRMapLocalTileManager


ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI47_0_0AIRMapLocalTile *tile = [ABI47_0_0AIRMapLocalTile new];
    return tile;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

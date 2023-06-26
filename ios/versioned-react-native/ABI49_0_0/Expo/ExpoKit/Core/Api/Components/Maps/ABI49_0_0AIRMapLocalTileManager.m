//
//  ABI49_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert+CoreLocation.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>
#import "ABI49_0_0AIRMapMarker.h"
#import "ABI49_0_0AIRMapLocalTile.h"

#import "ABI49_0_0AIRMapLocalTileManager.h"

@interface ABI49_0_0AIRMapLocalTileManager()

@end

@implementation ABI49_0_0AIRMapLocalTileManager


ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI49_0_0AIRMapLocalTile *tile = [ABI49_0_0AIRMapLocalTile new];
    return tile;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

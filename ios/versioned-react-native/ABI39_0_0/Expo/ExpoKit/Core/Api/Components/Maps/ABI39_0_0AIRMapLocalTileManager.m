//
//  ABI39_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert+CoreLocation.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>
#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>
#import <ABI39_0_0React/ABI39_0_0UIView+React.h>
#import "ABI39_0_0AIRMapMarker.h"
#import "ABI39_0_0AIRMapLocalTile.h"

#import "ABI39_0_0AIRMapLocalTileManager.h"

@interface ABI39_0_0AIRMapLocalTileManager()

@end

@implementation ABI39_0_0AIRMapLocalTileManager


ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI39_0_0AIRMapLocalTile *tile = [ABI39_0_0AIRMapLocalTile new];
    return tile;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

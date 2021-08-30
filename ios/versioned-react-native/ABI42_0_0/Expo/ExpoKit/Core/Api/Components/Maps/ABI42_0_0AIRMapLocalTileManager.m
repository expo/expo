//
//  ABI42_0_0AIRMapLocalTileManager.m
//  AirMaps
//
//  Created by Peter Zavadsky on 01/12/2017.
//  Copyright © 2017 Christopher. All rights reserved.
//

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert+CoreLocation.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import "ABI42_0_0AIRMapMarker.h"
#import "ABI42_0_0AIRMapLocalTile.h"

#import "ABI42_0_0AIRMapLocalTileManager.h"

@interface ABI42_0_0AIRMapLocalTileManager()

@end

@implementation ABI42_0_0AIRMapLocalTileManager


ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI42_0_0AIRMapLocalTile *tile = [ABI42_0_0AIRMapLocalTile new];
    return tile;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(pathTemplate, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

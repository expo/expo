//
//  ABI12_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import "ABI12_0_0RCTBridge.h"
#import "ABI12_0_0RCTConvert.h"
#import "ABI12_0_0RCTConvert+CoreLocation.h"
#import "ABI12_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI12_0_0.h"
#import "ABI12_0_0AIRMapMarker.h"
#import "ABI12_0_0RCTViewManager.h"
#import "ABI12_0_0AIRMapUrlTile.h"

#import "ABI12_0_0AIRMapUrlTileManager.h"

@interface ABI12_0_0AIRMapUrlTileManager()

@end

@implementation ABI12_0_0AIRMapUrlTileManager


ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI12_0_0AIRMapUrlTile *tile = [ABI12_0_0AIRMapUrlTile new];
    return tile;
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)

@end


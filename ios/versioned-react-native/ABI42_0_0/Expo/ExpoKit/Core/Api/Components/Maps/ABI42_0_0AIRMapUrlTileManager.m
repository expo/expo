//
//  ABI42_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert+CoreLocation.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import "ABI42_0_0AIRMapMarker.h"
#import "ABI42_0_0AIRMapUrlTile.h"

#import "ABI42_0_0AIRMapUrlTileManager.h"

@interface ABI42_0_0AIRMapUrlTileManager()

@end

@implementation ABI42_0_0AIRMapUrlTileManager


ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI42_0_0AIRMapUrlTile *tile = [ABI42_0_0AIRMapUrlTile new];
    return tile;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

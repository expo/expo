//
//  ABI36_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI36_0_0React/ABI36_0_0RCTBridge.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert+CoreLocation.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventDispatcher.h>
#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>
#import "ABI36_0_0AIRMapMarker.h"
#import "ABI36_0_0AIRMapUrlTile.h"

#import "ABI36_0_0AIRMapUrlTileManager.h"

@interface ABI36_0_0AIRMapUrlTileManager()

@end

@implementation ABI36_0_0AIRMapUrlTileManager


ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI36_0_0AIRMapUrlTile *tile = [ABI36_0_0AIRMapUrlTile new];
    return tile;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

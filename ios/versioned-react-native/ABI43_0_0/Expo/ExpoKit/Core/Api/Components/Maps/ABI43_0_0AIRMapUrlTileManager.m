//
//  ABI43_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert+CoreLocation.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventDispatcher.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>
#import <ABI43_0_0React/ABI43_0_0UIView+React.h>
#import "ABI43_0_0AIRMapMarker.h"
#import "ABI43_0_0AIRMapUrlTile.h"

#import "ABI43_0_0AIRMapUrlTileManager.h"

@interface ABI43_0_0AIRMapUrlTileManager()

@end

@implementation ABI43_0_0AIRMapUrlTileManager


ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI43_0_0AIRMapUrlTile *tile = [ABI43_0_0AIRMapUrlTile new];
    return tile;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

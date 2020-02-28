//
//  ABI37_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert+CoreLocation.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventDispatcher.h>
#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>
#import "ABI37_0_0AIRMapMarker.h"
#import "ABI37_0_0AIRMapUrlTile.h"

#import "ABI37_0_0AIRMapUrlTileManager.h"

@interface ABI37_0_0AIRMapUrlTileManager()

@end

@implementation ABI37_0_0AIRMapUrlTileManager


ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI37_0_0AIRMapUrlTile *tile = [ABI37_0_0AIRMapUrlTile new];
    return tile;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

//
//  ABI38_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert+CoreLocation.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventDispatcher.h>
#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>
#import <ABI38_0_0React/ABI38_0_0UIView+React.h>
#import "ABI38_0_0AIRMapMarker.h"
#import "ABI38_0_0AIRMapUrlTile.h"

#import "ABI38_0_0AIRMapUrlTileManager.h"

@interface ABI38_0_0AIRMapUrlTileManager()

@end

@implementation ABI38_0_0AIRMapUrlTileManager


ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI38_0_0AIRMapUrlTile *tile = [ABI38_0_0AIRMapUrlTile new];
    return tile;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

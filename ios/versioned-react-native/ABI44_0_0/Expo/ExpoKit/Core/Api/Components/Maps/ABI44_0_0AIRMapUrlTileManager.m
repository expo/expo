//
//  ABI44_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert+CoreLocation.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>
#import "ABI44_0_0AIRMapMarker.h"
#import "ABI44_0_0AIRMapUrlTile.h"

#import "ABI44_0_0AIRMapUrlTileManager.h"

@interface ABI44_0_0AIRMapUrlTileManager()

@end

@implementation ABI44_0_0AIRMapUrlTileManager


ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI44_0_0AIRMapUrlTile *tile = [ABI44_0_0AIRMapUrlTile new];
    return tile;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

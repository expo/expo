//
//  ABI39_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert+CoreLocation.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>
#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>
#import <ABI39_0_0React/ABI39_0_0UIView+React.h>
#import "ABI39_0_0AIRMapMarker.h"
#import "ABI39_0_0AIRMapUrlTile.h"

#import "ABI39_0_0AIRMapUrlTileManager.h"

@interface ABI39_0_0AIRMapUrlTileManager()

@end

@implementation ABI39_0_0AIRMapUrlTileManager


ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI39_0_0AIRMapUrlTile *tile = [ABI39_0_0AIRMapUrlTile new];
    return tile;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

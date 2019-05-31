//
//  ABI33_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert+CoreLocation.h>
#import <ReactABI33_0_0/ABI33_0_0RCTEventDispatcher.h>
#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>
#import "ABI33_0_0AIRMapMarker.h"
#import "ABI33_0_0AIRMapUrlTile.h"

#import "ABI33_0_0AIRMapUrlTileManager.h"

@interface ABI33_0_0AIRMapUrlTileManager()

@end

@implementation ABI33_0_0AIRMapUrlTileManager


ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI33_0_0AIRMapUrlTile *tile = [ABI33_0_0AIRMapUrlTile new];
    return tile;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, CGFloat)

@end

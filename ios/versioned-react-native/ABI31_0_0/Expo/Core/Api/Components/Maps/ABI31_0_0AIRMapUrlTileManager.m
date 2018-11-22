//
//  ABI31_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI31_0_0/ABI31_0_0RCTBridge.h>
#import <ReactABI31_0_0/ABI31_0_0RCTConvert.h>
#import <ReactABI31_0_0/ABI31_0_0RCTConvert+CoreLocation.h>
#import <ReactABI31_0_0/ABI31_0_0RCTEventDispatcher.h>
#import <ReactABI31_0_0/ABI31_0_0RCTViewManager.h>
#import <ReactABI31_0_0/UIView+ReactABI31_0_0.h>
#import "ABI31_0_0AIRMapMarker.h"
#import "ABI31_0_0AIRMapUrlTile.h"

#import "ABI31_0_0AIRMapUrlTileManager.h"

@interface ABI31_0_0AIRMapUrlTileManager()

@end

@implementation ABI31_0_0AIRMapUrlTileManager


ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI31_0_0AIRMapUrlTile *tile = [ABI31_0_0AIRMapUrlTile new];
    return tile;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)

@end

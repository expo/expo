//
//  ABI17_0_0AIRMapUrlTileManager.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/ABI17_0_0RCTConvert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTConvert+CoreLocation.h>
#import <ReactABI17_0_0/ABI17_0_0RCTEventDispatcher.h>
#import <ReactABI17_0_0/ABI17_0_0RCTViewManager.h>
#import <ReactABI17_0_0/UIView+ReactABI17_0_0.h>
#import "ABI17_0_0AIRMapMarker.h"
#import "ABI17_0_0AIRMapUrlTile.h"

#import "ABI17_0_0AIRMapUrlTileManager.h"

@interface ABI17_0_0AIRMapUrlTileManager()

@end

@implementation ABI17_0_0AIRMapUrlTileManager


ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI17_0_0AIRMapUrlTile *tile = [ABI17_0_0AIRMapUrlTile new];
    return tile;
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)

@end

//
//  ABI35_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ReactABI35_0_0/ABI35_0_0RCTBridge.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert+CoreLocation.h>
#import <ReactABI35_0_0/ABI35_0_0RCTEventDispatcher.h>
#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>
#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>
#import "ABI35_0_0AIRMapMarker.h"
#import "ABI35_0_0AIRMapWMSTile.h"

#import "ABI35_0_0AIRMapWMSTileManager.h"

@interface ABI35_0_0AIRMapWMSTileManager()

@end

@implementation ABI35_0_0AIRMapWMSTileManager


ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI35_0_0AIRMapWMSTile *tile = [ABI35_0_0AIRMapWMSTile new];
    return tile;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)

@end

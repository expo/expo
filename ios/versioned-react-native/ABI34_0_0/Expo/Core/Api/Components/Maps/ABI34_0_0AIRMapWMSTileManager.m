//
//  ABI34_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ReactABI34_0_0/ABI34_0_0RCTBridge.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert+CoreLocation.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventDispatcher.h>
#import <ReactABI34_0_0/ABI34_0_0RCTViewManager.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>
#import "ABI34_0_0AIRMapMarker.h"
#import "ABI34_0_0AIRMapWMSTile.h"

#import "ABI34_0_0AIRMapWMSTileManager.h"

@interface ABI34_0_0AIRMapWMSTileManager()

@end

@implementation ABI34_0_0AIRMapWMSTileManager


ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI34_0_0AIRMapWMSTile *tile = [ABI34_0_0AIRMapWMSTile new];
    return tile;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)

@end

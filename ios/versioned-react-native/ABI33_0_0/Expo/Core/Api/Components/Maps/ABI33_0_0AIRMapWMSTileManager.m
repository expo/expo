//
//  ABI33_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert+CoreLocation.h>
#import <ReactABI33_0_0/ABI33_0_0RCTEventDispatcher.h>
#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>
#import "ABI33_0_0AIRMapMarker.h"
#import "ABI33_0_0AIRMapWMSTile.h"

#import "ABI33_0_0AIRMapWMSTileManager.h"

@interface ABI33_0_0AIRMapWMSTileManager()

@end

@implementation ABI33_0_0AIRMapWMSTileManager


ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI33_0_0AIRMapWMSTile *tile = [ABI33_0_0AIRMapWMSTile new];
    return tile;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)

@end

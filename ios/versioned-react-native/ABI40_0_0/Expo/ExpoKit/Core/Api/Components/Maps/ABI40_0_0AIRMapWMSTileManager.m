//
//  ABI40_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>
#import <ABI40_0_0React/ABI40_0_0RCTConvert+CoreLocation.h>
#import <ABI40_0_0React/ABI40_0_0RCTEventDispatcher.h>
#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>
#import <ABI40_0_0React/ABI40_0_0UIView+React.h>
#import "ABI40_0_0AIRMapMarker.h"
#import "ABI40_0_0AIRMapWMSTile.h"

#import "ABI40_0_0AIRMapWMSTileManager.h"

@interface ABI40_0_0AIRMapWMSTileManager()

@end

@implementation ABI40_0_0AIRMapWMSTileManager


ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI40_0_0AIRMapWMSTile *tile = [ABI40_0_0AIRMapWMSTile new];
    return tile;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)

@end

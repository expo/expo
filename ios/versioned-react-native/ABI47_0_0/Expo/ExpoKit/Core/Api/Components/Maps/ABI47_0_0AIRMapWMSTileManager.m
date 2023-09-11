//
//  ABI47_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert+CoreLocation.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcher.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>
#import "ABI47_0_0AIRMapMarker.h"
#import "ABI47_0_0AIRMapWMSTile.h"

#import "ABI47_0_0AIRMapWMSTileManager.h"

@interface ABI47_0_0AIRMapWMSTileManager()

@end

@implementation ABI47_0_0AIRMapWMSTileManager


ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI47_0_0AIRMapWMSTile *tile = [ABI47_0_0AIRMapWMSTile new];
    return tile;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maximumNativeZ, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tileCachePath, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tileCacheMaxAge, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(offlineMode, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)

@end

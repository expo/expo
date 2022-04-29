//
//  ABI45_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>
#import <ABI45_0_0React/ABI45_0_0RCTConvert.h>
#import <ABI45_0_0React/ABI45_0_0RCTConvert+CoreLocation.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventDispatcher.h>
#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>
#import "ABI45_0_0AIRMapMarker.h"
#import "ABI45_0_0AIRMapWMSTile.h"

#import "ABI45_0_0AIRMapWMSTileManager.h"

@interface ABI45_0_0AIRMapWMSTileManager()

@end

@implementation ABI45_0_0AIRMapWMSTileManager


ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI45_0_0AIRMapWMSTile *tile = [ABI45_0_0AIRMapWMSTile new];
    return tile;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maximumNativeZ, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tileCachePath, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tileCacheMaxAge, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(offlineMode, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)

@end

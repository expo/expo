//
//  ABI48_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert+CoreLocation.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventDispatcher.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>
#import "ABI48_0_0AIRMapMarker.h"
#import "ABI48_0_0AIRMapWMSTile.h"

#import "ABI48_0_0AIRMapWMSTileManager.h"

@interface ABI48_0_0AIRMapWMSTileManager()

@end

@implementation ABI48_0_0AIRMapWMSTileManager


ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI48_0_0AIRMapWMSTile *tile = [ABI48_0_0AIRMapWMSTile new];
    return tile;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maximumNativeZ, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tileCachePath, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tileCacheMaxAge, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(offlineMode, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)

@end

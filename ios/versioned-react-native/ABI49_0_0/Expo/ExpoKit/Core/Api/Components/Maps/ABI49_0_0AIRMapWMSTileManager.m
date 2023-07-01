//
//  ABI49_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert+CoreLocation.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>
#import "ABI49_0_0AIRMapMarker.h"
#import "ABI49_0_0AIRMapWMSTile.h"

#import "ABI49_0_0AIRMapWMSTileManager.h"

@interface ABI49_0_0AIRMapWMSTileManager()

@end

@implementation ABI49_0_0AIRMapWMSTileManager


ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI49_0_0AIRMapWMSTile *tile = [ABI49_0_0AIRMapWMSTile new];
    return tile;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maximumNativeZ, NSInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(tileCachePath, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(tileCacheMaxAge, NSInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(offlineMode, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)

@end

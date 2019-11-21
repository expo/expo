//
//  ABI36_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ABI36_0_0React/ABI36_0_0RCTBridge.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert+CoreLocation.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventDispatcher.h>
#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>
#import "ABI36_0_0AIRMapMarker.h"
#import "ABI36_0_0AIRMapWMSTile.h"

#import "ABI36_0_0AIRMapWMSTileManager.h"

@interface ABI36_0_0AIRMapWMSTileManager()

@end

@implementation ABI36_0_0AIRMapWMSTileManager


ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI36_0_0AIRMapWMSTile *tile = [ABI36_0_0AIRMapWMSTile new];
    return tile;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)

@end

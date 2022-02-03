//
//  ABI44_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert+CoreLocation.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>
#import "ABI44_0_0AIRMapMarker.h"
#import "ABI44_0_0AIRMapWMSTile.h"

#import "ABI44_0_0AIRMapWMSTileManager.h"

@interface ABI44_0_0AIRMapWMSTileManager()

@end

@implementation ABI44_0_0AIRMapWMSTileManager


ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI44_0_0AIRMapWMSTile *tile = [ABI44_0_0AIRMapWMSTile new];
    return tile;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)

@end

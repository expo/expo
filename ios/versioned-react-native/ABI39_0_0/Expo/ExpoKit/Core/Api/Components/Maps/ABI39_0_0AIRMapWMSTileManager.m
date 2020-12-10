//
//  ABI39_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert+CoreLocation.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>
#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>
#import <ABI39_0_0React/ABI39_0_0UIView+React.h>
#import "ABI39_0_0AIRMapMarker.h"
#import "ABI39_0_0AIRMapWMSTile.h"

#import "ABI39_0_0AIRMapWMSTileManager.h"

@interface ABI39_0_0AIRMapWMSTileManager()

@end

@implementation ABI39_0_0AIRMapWMSTileManager


ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI39_0_0AIRMapWMSTile *tile = [ABI39_0_0AIRMapWMSTile new];
    return tile;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)

@end

//
//  ABI37_0_0AIRMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//


#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert+CoreLocation.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventDispatcher.h>
#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>
#import "ABI37_0_0AIRMapMarker.h"
#import "ABI37_0_0AIRMapWMSTile.h"

#import "ABI37_0_0AIRMapWMSTileManager.h"

@interface ABI37_0_0AIRMapWMSTileManager()

@end

@implementation ABI37_0_0AIRMapWMSTileManager


ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI37_0_0AIRMapWMSTile *tile = [ABI37_0_0AIRMapWMSTile new];
    return tile;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(shouldReplaceMapContent, BOOL)

@end

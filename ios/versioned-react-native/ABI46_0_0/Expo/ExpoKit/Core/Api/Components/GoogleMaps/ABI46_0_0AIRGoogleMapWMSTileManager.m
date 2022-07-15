//
//  ABI46_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI46_0_0HAVE_GOOGLE_MAPS

#import "ABI46_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI46_0_0AIRGoogleMapWMSTile.h"

@interface ABI46_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI46_0_0AIRGoogleMapWMSTileManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI46_0_0AIRGoogleMapWMSTile *tileLayer = [ABI46_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

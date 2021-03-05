//
//  ABI40_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI40_0_0HAVE_GOOGLE_MAPS

#import "ABI40_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI40_0_0AIRGoogleMapWMSTile.h"

@interface ABI40_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI40_0_0AIRGoogleMapWMSTileManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI40_0_0AIRGoogleMapWMSTile *tileLayer = [ABI40_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

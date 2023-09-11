//
//  ABI47_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI47_0_0HAVE_GOOGLE_MAPS

#import "ABI47_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI47_0_0AIRGoogleMapWMSTile.h"

@interface ABI47_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI47_0_0AIRGoogleMapWMSTileManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI47_0_0AIRGoogleMapWMSTile *tileLayer = [ABI47_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

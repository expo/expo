//
//  ABI48_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import "ABI48_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI48_0_0AIRGoogleMapWMSTile.h"

@interface ABI48_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI48_0_0AIRGoogleMapWMSTileManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI48_0_0AIRGoogleMapWMSTile *tileLayer = [ABI48_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

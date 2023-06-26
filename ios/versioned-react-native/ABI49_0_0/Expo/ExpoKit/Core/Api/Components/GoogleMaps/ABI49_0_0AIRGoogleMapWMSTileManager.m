//
//  ABI49_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI49_0_0HAVE_GOOGLE_MAPS

#import "ABI49_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI49_0_0AIRGoogleMapWMSTile.h"

@interface ABI49_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI49_0_0AIRGoogleMapWMSTileManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI49_0_0AIRGoogleMapWMSTile *tileLayer = [ABI49_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

//
//  ABI38_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI38_0_0HAVE_GOOGLE_MAPS

#import "ABI38_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI38_0_0AIRGoogleMapWMSTile.h"

@interface ABI38_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI38_0_0AIRGoogleMapWMSTileManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI38_0_0AIRGoogleMapWMSTile *tileLayer = [ABI38_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

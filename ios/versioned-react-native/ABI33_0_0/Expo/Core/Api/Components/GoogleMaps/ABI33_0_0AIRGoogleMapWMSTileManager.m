//
//  ABI33_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS

#import "ABI33_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI33_0_0AIRGoogleMapWMSTile.h"

@interface ABI33_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI33_0_0AIRGoogleMapWMSTileManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI33_0_0AIRGoogleMapWMSTile *tileLayer = [ABI33_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

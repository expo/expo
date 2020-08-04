//
//  ABI37_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI37_0_0HAVE_GOOGLE_MAPS

#import "ABI37_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI37_0_0AIRGoogleMapWMSTile.h"

@interface ABI37_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI37_0_0AIRGoogleMapWMSTileManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI37_0_0AIRGoogleMapWMSTile *tileLayer = [ABI37_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

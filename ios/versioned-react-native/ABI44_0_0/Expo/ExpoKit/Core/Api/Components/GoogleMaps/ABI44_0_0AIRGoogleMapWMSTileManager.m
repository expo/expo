//
//  ABI44_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI44_0_0HAVE_GOOGLE_MAPS

#import "ABI44_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI44_0_0AIRGoogleMapWMSTile.h"

@interface ABI44_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI44_0_0AIRGoogleMapWMSTileManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI44_0_0AIRGoogleMapWMSTile *tileLayer = [ABI44_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

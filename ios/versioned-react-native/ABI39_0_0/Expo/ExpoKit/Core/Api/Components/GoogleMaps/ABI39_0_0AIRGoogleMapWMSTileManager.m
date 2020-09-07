//
//  ABI39_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI39_0_0HAVE_GOOGLE_MAPS

#import "ABI39_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI39_0_0AIRGoogleMapWMSTile.h"

@interface ABI39_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI39_0_0AIRGoogleMapWMSTileManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI39_0_0AIRGoogleMapWMSTile *tileLayer = [ABI39_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

//
//  ABI42_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI42_0_0HAVE_GOOGLE_MAPS

#import "ABI42_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI42_0_0AIRGoogleMapWMSTile.h"

@interface ABI42_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI42_0_0AIRGoogleMapWMSTileManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI42_0_0AIRGoogleMapWMSTile *tileLayer = [ABI42_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

//
//  ABI43_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI43_0_0HAVE_GOOGLE_MAPS

#import "ABI43_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI43_0_0AIRGoogleMapWMSTile.h"

@interface ABI43_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI43_0_0AIRGoogleMapWMSTileManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI43_0_0AIRGoogleMapWMSTile *tileLayer = [ABI43_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

//
//  ABI36_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI36_0_0HAVE_GOOGLE_MAPS

#import "ABI36_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI36_0_0AIRGoogleMapWMSTile.h"

@interface ABI36_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI36_0_0AIRGoogleMapWMSTileManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI36_0_0AIRGoogleMapWMSTile *tileLayer = [ABI36_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

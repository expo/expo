//
//  ABI45_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI45_0_0HAVE_GOOGLE_MAPS

#import "ABI45_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI45_0_0AIRGoogleMapWMSTile.h"

@interface ABI45_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI45_0_0AIRGoogleMapWMSTileManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI45_0_0AIRGoogleMapWMSTile *tileLayer = [ABI45_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

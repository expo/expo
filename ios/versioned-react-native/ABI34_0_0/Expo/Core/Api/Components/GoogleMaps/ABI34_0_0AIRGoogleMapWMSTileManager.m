//
//  ABI34_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI34_0_0HAVE_GOOGLE_MAPS

#import "ABI34_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI34_0_0AIRGoogleMapWMSTile.h"

@interface ABI34_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI34_0_0AIRGoogleMapWMSTileManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI34_0_0AIRGoogleMapWMSTile *tileLayer = [ABI34_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

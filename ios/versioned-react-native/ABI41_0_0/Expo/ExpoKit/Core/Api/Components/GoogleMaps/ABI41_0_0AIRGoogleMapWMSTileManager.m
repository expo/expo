//
//  ABI41_0_0AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI41_0_0HAVE_GOOGLE_MAPS

#import "ABI41_0_0AIRGoogleMapWMSTileManager.h"
#import "ABI41_0_0AIRGoogleMapWMSTile.h"

@interface ABI41_0_0AIRGoogleMapWMSTileManager()

@end

@implementation ABI41_0_0AIRGoogleMapWMSTileManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI41_0_0AIRGoogleMapWMSTile *tileLayer = [ABI41_0_0AIRGoogleMapWMSTile new];
    return tileLayer;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

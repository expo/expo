//
//  AIRGoogleMapWMSTileManager.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef HAVE_GOOGLE_MAPS

#import "AIRGoogleMapWMSTileManager.h"
#import "AIRGoogleMapWMSTile.h"

@interface AIRGoogleMapWMSTileManager()

@end

@implementation AIRGoogleMapWMSTileManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
    AIRGoogleMapWMSTile *tileLayer = [AIRGoogleMapWMSTile new];
    return tileLayer;
}

RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
RCT_EXPORT_VIEW_PROPERTY(maximumZ, int)
RCT_EXPORT_VIEW_PROPERTY(minimumZ, int)
RCT_EXPORT_VIEW_PROPERTY(tileSize, int)
RCT_EXPORT_VIEW_PROPERTY(opacity, float)

@end

#endif

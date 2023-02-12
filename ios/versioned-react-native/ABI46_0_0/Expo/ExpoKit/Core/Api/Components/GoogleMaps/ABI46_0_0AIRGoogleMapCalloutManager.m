//
//  ABI46_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI46_0_0HAVE_GOOGLE_MAPS

#import "ABI46_0_0AIRGoogleMapCalloutManager.h"
#import "ABI46_0_0AIRGoogleMapCallout.h"
#import <ABI46_0_0React/ABI46_0_0RCTView.h>

@implementation ABI46_0_0AIRGoogleMapCalloutManager
ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI46_0_0AIRGoogleMapCallout *callout = [ABI46_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI46_0_0RCTBubblingEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

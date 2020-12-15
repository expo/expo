//
//  ABI40_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI40_0_0HAVE_GOOGLE_MAPS

#import "ABI40_0_0AIRGoogleMapCalloutManager.h"
#import "ABI40_0_0AIRGoogleMapCallout.h"
#import <ABI40_0_0React/ABI40_0_0RCTView.h>

@implementation ABI40_0_0AIRGoogleMapCalloutManager
ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI40_0_0AIRGoogleMapCallout *callout = [ABI40_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI40_0_0RCTBubblingEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

//
//  ABI47_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI47_0_0HAVE_GOOGLE_MAPS

#import "ABI47_0_0AIRGoogleMapCalloutManager.h"
#import "ABI47_0_0AIRGoogleMapCallout.h"
#import <ABI47_0_0React/ABI47_0_0RCTView.h>

@implementation ABI47_0_0AIRGoogleMapCalloutManager
ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0AIRGoogleMapCallout *callout = [ABI47_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

//
//  ABI48_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import "ABI48_0_0AIRGoogleMapCalloutManager.h"
#import "ABI48_0_0AIRGoogleMapCallout.h"
#import <ABI48_0_0React/ABI48_0_0RCTView.h>

@implementation ABI48_0_0AIRGoogleMapCalloutManager
ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0AIRGoogleMapCallout *callout = [ABI48_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI48_0_0RCTBubblingEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

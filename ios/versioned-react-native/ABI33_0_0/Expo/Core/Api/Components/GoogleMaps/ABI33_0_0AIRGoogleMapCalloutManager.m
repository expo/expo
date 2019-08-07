//
//  ABI33_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS

#import "ABI33_0_0AIRGoogleMapCalloutManager.h"
#import "ABI33_0_0AIRGoogleMapCallout.h"
#import <ReactABI33_0_0/ABI33_0_0RCTView.h>

@implementation ABI33_0_0AIRGoogleMapCalloutManager
ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0AIRGoogleMapCallout *callout = [ABI33_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

//
//  ABI42_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI42_0_0HAVE_GOOGLE_MAPS

#import "ABI42_0_0AIRGoogleMapCalloutManager.h"
#import "ABI42_0_0AIRGoogleMapCallout.h"
#import <ABI42_0_0React/ABI42_0_0RCTView.h>

@implementation ABI42_0_0AIRGoogleMapCalloutManager
ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI42_0_0AIRGoogleMapCallout *callout = [ABI42_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI42_0_0RCTBubblingEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

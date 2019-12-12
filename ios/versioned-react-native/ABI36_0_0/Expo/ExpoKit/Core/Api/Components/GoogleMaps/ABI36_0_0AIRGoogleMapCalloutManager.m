//
//  ABI36_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI36_0_0HAVE_GOOGLE_MAPS

#import "ABI36_0_0AIRGoogleMapCalloutManager.h"
#import "ABI36_0_0AIRGoogleMapCallout.h"
#import <ABI36_0_0React/ABI36_0_0RCTView.h>

@implementation ABI36_0_0AIRGoogleMapCalloutManager
ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0AIRGoogleMapCallout *callout = [ABI36_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI36_0_0RCTBubblingEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

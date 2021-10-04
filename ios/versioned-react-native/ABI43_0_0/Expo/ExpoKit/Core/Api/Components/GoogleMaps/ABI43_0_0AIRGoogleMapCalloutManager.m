//
//  ABI43_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI43_0_0HAVE_GOOGLE_MAPS

#import "ABI43_0_0AIRGoogleMapCalloutManager.h"
#import "ABI43_0_0AIRGoogleMapCallout.h"
#import <ABI43_0_0React/ABI43_0_0RCTView.h>

@implementation ABI43_0_0AIRGoogleMapCalloutManager
ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0AIRGoogleMapCallout *callout = [ABI43_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI43_0_0RCTBubblingEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

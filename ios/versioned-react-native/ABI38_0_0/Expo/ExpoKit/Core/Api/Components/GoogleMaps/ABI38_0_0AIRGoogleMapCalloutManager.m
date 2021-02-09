//
//  ABI38_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI38_0_0HAVE_GOOGLE_MAPS

#import "ABI38_0_0AIRGoogleMapCalloutManager.h"
#import "ABI38_0_0AIRGoogleMapCallout.h"
#import <ABI38_0_0React/ABI38_0_0RCTView.h>

@implementation ABI38_0_0AIRGoogleMapCalloutManager
ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI38_0_0AIRGoogleMapCallout *callout = [ABI38_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI38_0_0RCTBubblingEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

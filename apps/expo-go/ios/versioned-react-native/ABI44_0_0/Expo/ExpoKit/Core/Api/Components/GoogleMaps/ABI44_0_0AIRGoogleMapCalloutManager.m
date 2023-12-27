//
//  ABI44_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI44_0_0HAVE_GOOGLE_MAPS

#import "ABI44_0_0AIRGoogleMapCalloutManager.h"
#import "ABI44_0_0AIRGoogleMapCallout.h"
#import <ABI44_0_0React/ABI44_0_0RCTView.h>

@implementation ABI44_0_0AIRGoogleMapCalloutManager
ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0AIRGoogleMapCallout *callout = [ABI44_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI44_0_0RCTBubblingEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

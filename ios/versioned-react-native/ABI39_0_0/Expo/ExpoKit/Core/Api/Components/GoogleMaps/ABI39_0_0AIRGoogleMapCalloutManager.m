//
//  ABI39_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI39_0_0HAVE_GOOGLE_MAPS

#import "ABI39_0_0AIRGoogleMapCalloutManager.h"
#import "ABI39_0_0AIRGoogleMapCallout.h"
#import <ABI39_0_0React/ABI39_0_0RCTView.h>

@implementation ABI39_0_0AIRGoogleMapCalloutManager
ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0AIRGoogleMapCallout *callout = [ABI39_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI39_0_0RCTBubblingEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

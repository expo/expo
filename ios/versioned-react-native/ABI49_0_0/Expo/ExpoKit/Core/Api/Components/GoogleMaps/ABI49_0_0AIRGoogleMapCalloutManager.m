//
//  ABI49_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI49_0_0HAVE_GOOGLE_MAPS

#import "ABI49_0_0AIRGoogleMapCalloutManager.h"
#import "ABI49_0_0AIRGoogleMapCallout.h"
#import <ABI49_0_0React/ABI49_0_0RCTView.h>

@implementation ABI49_0_0AIRGoogleMapCalloutManager
ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI49_0_0AIRGoogleMapCallout *callout = [ABI49_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI49_0_0RCTBubblingEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

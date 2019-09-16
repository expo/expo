//
//  ABI35_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI35_0_0HAVE_GOOGLE_MAPS

#import "ABI35_0_0AIRGoogleMapCalloutManager.h"
#import "ABI35_0_0AIRGoogleMapCallout.h"
#import <ReactABI35_0_0/ABI35_0_0RCTView.h>

@implementation ABI35_0_0AIRGoogleMapCalloutManager
ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI35_0_0AIRGoogleMapCallout *callout = [ABI35_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI35_0_0RCTBubblingEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

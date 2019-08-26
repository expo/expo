//
//  ABI32_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI32_0_0AIRGoogleMapCalloutManager.h"
#import "ABI32_0_0AIRGoogleMapCallout.h"
#import <ReactABI32_0_0/ABI32_0_0RCTView.h>

@implementation ABI32_0_0AIRGoogleMapCalloutManager
ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI32_0_0AIRGoogleMapCallout *callout = [ABI32_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI32_0_0RCTBubblingEventBlock)

@end

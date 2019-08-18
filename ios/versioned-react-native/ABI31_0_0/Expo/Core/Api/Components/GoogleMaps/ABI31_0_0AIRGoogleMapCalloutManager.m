//
//  ABI31_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI31_0_0AIRGoogleMapCalloutManager.h"
#import "ABI31_0_0AIRGoogleMapCallout.h"
#import <ReactABI31_0_0/ABI31_0_0RCTView.h>

@implementation ABI31_0_0AIRGoogleMapCalloutManager
ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI31_0_0AIRGoogleMapCallout *callout = [ABI31_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI31_0_0RCTBubblingEventBlock)

@end

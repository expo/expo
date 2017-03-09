//
//  ABI15_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI15_0_0AIRGoogleMapCalloutManager.h"
#import "ABI15_0_0AIRGoogleMapCallout.h"
#import <ReactABI15_0_0/ABI15_0_0RCTView.h>

@implementation ABI15_0_0AIRGoogleMapCalloutManager
ABI15_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI15_0_0AIRGoogleMapCallout *callout = [ABI15_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI15_0_0RCTBubblingEventBlock)

@end

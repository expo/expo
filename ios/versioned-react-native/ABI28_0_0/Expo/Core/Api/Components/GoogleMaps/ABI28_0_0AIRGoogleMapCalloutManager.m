//
//  ABI28_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI28_0_0AIRGoogleMapCalloutManager.h"
#import "ABI28_0_0AIRGoogleMapCallout.h"
#import <ReactABI28_0_0/ABI28_0_0RCTView.h>

@implementation ABI28_0_0AIRGoogleMapCalloutManager
ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI28_0_0AIRGoogleMapCallout *callout = [ABI28_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI28_0_0RCTBubblingEventBlock)

@end

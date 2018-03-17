//
//  ABI26_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI26_0_0AIRGoogleMapCalloutManager.h"
#import "ABI26_0_0AIRGoogleMapCallout.h"
#import <ReactABI26_0_0/ABI26_0_0RCTView.h>

@implementation ABI26_0_0AIRGoogleMapCalloutManager
ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI26_0_0AIRGoogleMapCallout *callout = [ABI26_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI26_0_0RCTBubblingEventBlock)

@end

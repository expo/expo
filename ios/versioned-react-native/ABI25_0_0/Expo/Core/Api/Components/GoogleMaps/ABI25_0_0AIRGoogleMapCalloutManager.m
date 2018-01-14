//
//  ABI25_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI25_0_0AIRGoogleMapCalloutManager.h"
#import "ABI25_0_0AIRGoogleMapCallout.h"
#import <ReactABI25_0_0/ABI25_0_0RCTView.h>

@implementation ABI25_0_0AIRGoogleMapCalloutManager
ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI25_0_0AIRGoogleMapCallout *callout = [ABI25_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI25_0_0RCTBubblingEventBlock)

@end

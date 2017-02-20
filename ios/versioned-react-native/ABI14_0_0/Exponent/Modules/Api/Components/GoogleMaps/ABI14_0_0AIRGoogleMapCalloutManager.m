//
//  ABI14_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI14_0_0AIRGoogleMapCalloutManager.h"
#import "ABI14_0_0AIRGoogleMapCallout.h"
#import <ReactABI14_0_0/ABI14_0_0RCTView.h>

@implementation ABI14_0_0AIRGoogleMapCalloutManager
ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI14_0_0AIRGoogleMapCallout *callout = [ABI14_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI14_0_0RCTBubblingEventBlock)

@end

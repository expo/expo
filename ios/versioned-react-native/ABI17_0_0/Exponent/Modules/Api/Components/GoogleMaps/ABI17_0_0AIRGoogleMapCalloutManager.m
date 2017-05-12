//
//  ABI17_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI17_0_0AIRGoogleMapCalloutManager.h"
#import "ABI17_0_0AIRGoogleMapCallout.h"
#import <ReactABI17_0_0/ABI17_0_0RCTView.h>

@implementation ABI17_0_0AIRGoogleMapCalloutManager
ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI17_0_0AIRGoogleMapCallout *callout = [ABI17_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI17_0_0RCTBubblingEventBlock)

@end

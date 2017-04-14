//
//  ABI16_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI16_0_0AIRGoogleMapCalloutManager.h"
#import "ABI16_0_0AIRGoogleMapCallout.h"
#import <ReactABI16_0_0/ABI16_0_0RCTView.h>

@implementation ABI16_0_0AIRGoogleMapCalloutManager
ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI16_0_0AIRGoogleMapCallout *callout = [ABI16_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI16_0_0RCTBubblingEventBlock)

@end

//
//  ABI24_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI24_0_0AIRGoogleMapCalloutManager.h"
#import "ABI24_0_0AIRGoogleMapCallout.h"
#import <ReactABI24_0_0/ABI24_0_0RCTView.h>

@implementation ABI24_0_0AIRGoogleMapCalloutManager
ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI24_0_0AIRGoogleMapCallout *callout = [ABI24_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI24_0_0RCTBubblingEventBlock)

@end

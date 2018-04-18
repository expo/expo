//
//  ABI27_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI27_0_0AIRGoogleMapCalloutManager.h"
#import "ABI27_0_0AIRGoogleMapCallout.h"
#import <ReactABI27_0_0/ABI27_0_0RCTView.h>

@implementation ABI27_0_0AIRGoogleMapCalloutManager
ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI27_0_0AIRGoogleMapCallout *callout = [ABI27_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI27_0_0RCTBubblingEventBlock)

@end

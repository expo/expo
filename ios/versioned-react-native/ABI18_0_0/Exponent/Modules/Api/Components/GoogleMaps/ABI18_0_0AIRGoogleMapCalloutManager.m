//
//  ABI18_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI18_0_0AIRGoogleMapCalloutManager.h"
#import "ABI18_0_0AIRGoogleMapCallout.h"
#import <ReactABI18_0_0/ABI18_0_0RCTView.h>

@implementation ABI18_0_0AIRGoogleMapCalloutManager
ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI18_0_0AIRGoogleMapCallout *callout = [ABI18_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI18_0_0RCTBubblingEventBlock)

@end

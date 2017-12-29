//
//  ABI21_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI21_0_0AIRGoogleMapCalloutManager.h"
#import "ABI21_0_0AIRGoogleMapCallout.h"
#import <ReactABI21_0_0/ABI21_0_0RCTView.h>

@implementation ABI21_0_0AIRGoogleMapCalloutManager
ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI21_0_0AIRGoogleMapCallout *callout = [ABI21_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI21_0_0RCTBubblingEventBlock)

@end

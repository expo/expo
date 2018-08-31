//
//  ABI30_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI30_0_0AIRGoogleMapCalloutManager.h"
#import "ABI30_0_0AIRGoogleMapCallout.h"
#import <ReactABI30_0_0/ABI30_0_0RCTView.h>

@implementation ABI30_0_0AIRGoogleMapCalloutManager
ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI30_0_0AIRGoogleMapCallout *callout = [ABI30_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI30_0_0RCTBubblingEventBlock)

@end

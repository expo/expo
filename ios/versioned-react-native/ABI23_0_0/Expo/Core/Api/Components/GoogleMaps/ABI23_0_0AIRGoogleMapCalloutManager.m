//
//  ABI23_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI23_0_0AIRGoogleMapCalloutManager.h"
#import "ABI23_0_0AIRGoogleMapCallout.h"
#import <ReactABI23_0_0/ABI23_0_0RCTView.h>

@implementation ABI23_0_0AIRGoogleMapCalloutManager
ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI23_0_0AIRGoogleMapCallout *callout = [ABI23_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI23_0_0RCTBubblingEventBlock)

@end

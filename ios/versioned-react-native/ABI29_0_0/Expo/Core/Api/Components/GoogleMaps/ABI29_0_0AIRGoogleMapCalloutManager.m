//
//  ABI29_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI29_0_0AIRGoogleMapCalloutManager.h"
#import "ABI29_0_0AIRGoogleMapCallout.h"
#import <ReactABI29_0_0/ABI29_0_0RCTView.h>

@implementation ABI29_0_0AIRGoogleMapCalloutManager
ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI29_0_0AIRGoogleMapCallout *callout = [ABI29_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI29_0_0RCTBubblingEventBlock)

@end

//
//  ABI22_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI22_0_0AIRGoogleMapCalloutManager.h"
#import "ABI22_0_0AIRGoogleMapCallout.h"
#import <ReactABI22_0_0/ABI22_0_0RCTView.h>

@implementation ABI22_0_0AIRGoogleMapCalloutManager
ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI22_0_0AIRGoogleMapCallout *callout = [ABI22_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI22_0_0RCTBubblingEventBlock)

@end

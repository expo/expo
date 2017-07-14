//
//  ABI19_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import "ABI19_0_0AIRGoogleMapCalloutManager.h"
#import "ABI19_0_0AIRGoogleMapCallout.h"
#import <ReactABI19_0_0/ABI19_0_0RCTView.h>

@implementation ABI19_0_0AIRGoogleMapCalloutManager
ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI19_0_0AIRGoogleMapCallout *callout = [ABI19_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI19_0_0RCTBubblingEventBlock)

@end

//
//  ABI34_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI34_0_0HAVE_GOOGLE_MAPS

#import "ABI34_0_0AIRGoogleMapCalloutManager.h"
#import "ABI34_0_0AIRGoogleMapCallout.h"
#import <ReactABI34_0_0/ABI34_0_0RCTView.h>

@implementation ABI34_0_0AIRGoogleMapCalloutManager
ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI34_0_0AIRGoogleMapCallout *callout = [ABI34_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI34_0_0RCTBubblingEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

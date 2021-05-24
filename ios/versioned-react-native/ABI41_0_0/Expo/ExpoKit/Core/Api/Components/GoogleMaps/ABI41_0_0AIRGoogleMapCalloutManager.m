//
//  ABI41_0_0AIRGoogleMapCalloutManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI41_0_0HAVE_GOOGLE_MAPS

#import "ABI41_0_0AIRGoogleMapCalloutManager.h"
#import "ABI41_0_0AIRGoogleMapCallout.h"
#import <ABI41_0_0React/ABI41_0_0RCTView.h>

@implementation ABI41_0_0AIRGoogleMapCalloutManager
ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI41_0_0AIRGoogleMapCallout *callout = [ABI41_0_0AIRGoogleMapCallout new];
  return callout;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(tooltip, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI41_0_0RCTBubblingEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(alphaHitTest, BOOL)

@end

#endif

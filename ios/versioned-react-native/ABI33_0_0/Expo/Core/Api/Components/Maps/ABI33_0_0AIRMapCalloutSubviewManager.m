//
//  ABI33_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI33_0_0AIRMapCalloutSubviewManager.h"
#import "ABI33_0_0AIRMapCalloutSubview.h"
#import <ReactABI33_0_0/ABI33_0_0RCTView.h>

@implementation ABI33_0_0AIRMapCalloutSubviewManager
ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0AIRMapCalloutSubview *calloutSubview = [ABI33_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI33_0_0RCTBubblingEventBlock)

@end

//
//  ABI40_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI40_0_0AIRMapCalloutSubviewManager.h"
#import "ABI40_0_0AIRMapCalloutSubview.h"
#import <ABI40_0_0React/ABI40_0_0RCTView.h>

@implementation ABI40_0_0AIRMapCalloutSubviewManager
ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI40_0_0AIRMapCalloutSubview *calloutSubview = [ABI40_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI40_0_0RCTBubblingEventBlock)

@end

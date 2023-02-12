//
//  ABI48_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI48_0_0AIRMapCalloutSubviewManager.h"
#import "ABI48_0_0AIRMapCalloutSubview.h"
#import <ABI48_0_0React/ABI48_0_0RCTView.h>

@implementation ABI48_0_0AIRMapCalloutSubviewManager
ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0AIRMapCalloutSubview *calloutSubview = [ABI48_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI48_0_0RCTBubblingEventBlock)

@end

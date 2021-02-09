//
//  ABI38_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI38_0_0AIRMapCalloutSubviewManager.h"
#import "ABI38_0_0AIRMapCalloutSubview.h"
#import <ABI38_0_0React/ABI38_0_0RCTView.h>

@implementation ABI38_0_0AIRMapCalloutSubviewManager
ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI38_0_0AIRMapCalloutSubview *calloutSubview = [ABI38_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI38_0_0RCTBubblingEventBlock)

@end

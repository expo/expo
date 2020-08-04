//
//  ABI37_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI37_0_0AIRMapCalloutSubviewManager.h"
#import "ABI37_0_0AIRMapCalloutSubview.h"
#import <ABI37_0_0React/ABI37_0_0RCTView.h>

@implementation ABI37_0_0AIRMapCalloutSubviewManager
ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI37_0_0AIRMapCalloutSubview *calloutSubview = [ABI37_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI37_0_0RCTBubblingEventBlock)

@end

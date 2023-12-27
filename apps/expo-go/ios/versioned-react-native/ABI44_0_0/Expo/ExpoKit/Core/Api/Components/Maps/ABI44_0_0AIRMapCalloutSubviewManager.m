//
//  ABI44_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI44_0_0AIRMapCalloutSubviewManager.h"
#import "ABI44_0_0AIRMapCalloutSubview.h"
#import <ABI44_0_0React/ABI44_0_0RCTView.h>

@implementation ABI44_0_0AIRMapCalloutSubviewManager
ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0AIRMapCalloutSubview *calloutSubview = [ABI44_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI44_0_0RCTBubblingEventBlock)

@end

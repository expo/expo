//
//  ABI47_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI47_0_0AIRMapCalloutSubviewManager.h"
#import "ABI47_0_0AIRMapCalloutSubview.h"
#import <ABI47_0_0React/ABI47_0_0RCTView.h>

@implementation ABI47_0_0AIRMapCalloutSubviewManager
ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0AIRMapCalloutSubview *calloutSubview = [ABI47_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI47_0_0RCTBubblingEventBlock)

@end

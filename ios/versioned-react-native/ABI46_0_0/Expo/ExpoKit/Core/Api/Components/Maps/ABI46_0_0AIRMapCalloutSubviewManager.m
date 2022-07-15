//
//  ABI46_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI46_0_0AIRMapCalloutSubviewManager.h"
#import "ABI46_0_0AIRMapCalloutSubview.h"
#import <ABI46_0_0React/ABI46_0_0RCTView.h>

@implementation ABI46_0_0AIRMapCalloutSubviewManager
ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI46_0_0AIRMapCalloutSubview *calloutSubview = [ABI46_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI46_0_0RCTBubblingEventBlock)

@end

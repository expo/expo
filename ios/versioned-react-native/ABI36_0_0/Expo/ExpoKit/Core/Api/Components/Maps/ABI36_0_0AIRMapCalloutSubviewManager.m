//
//  ABI36_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI36_0_0AIRMapCalloutSubviewManager.h"
#import "ABI36_0_0AIRMapCalloutSubview.h"
#import <ABI36_0_0React/ABI36_0_0RCTView.h>

@implementation ABI36_0_0AIRMapCalloutSubviewManager
ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0AIRMapCalloutSubview *calloutSubview = [ABI36_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI36_0_0RCTBubblingEventBlock)

@end

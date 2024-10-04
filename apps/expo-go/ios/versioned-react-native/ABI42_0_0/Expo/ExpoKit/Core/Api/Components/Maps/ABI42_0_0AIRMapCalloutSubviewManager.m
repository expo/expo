//
//  ABI42_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI42_0_0AIRMapCalloutSubviewManager.h"
#import "ABI42_0_0AIRMapCalloutSubview.h"
#import <ABI42_0_0React/ABI42_0_0RCTView.h>

@implementation ABI42_0_0AIRMapCalloutSubviewManager
ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI42_0_0AIRMapCalloutSubview *calloutSubview = [ABI42_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI42_0_0RCTBubblingEventBlock)

@end

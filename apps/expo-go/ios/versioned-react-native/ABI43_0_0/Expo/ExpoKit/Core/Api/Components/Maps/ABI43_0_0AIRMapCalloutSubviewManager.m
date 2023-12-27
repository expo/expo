//
//  ABI43_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI43_0_0AIRMapCalloutSubviewManager.h"
#import "ABI43_0_0AIRMapCalloutSubview.h"
#import <ABI43_0_0React/ABI43_0_0RCTView.h>

@implementation ABI43_0_0AIRMapCalloutSubviewManager
ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0AIRMapCalloutSubview *calloutSubview = [ABI43_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI43_0_0RCTBubblingEventBlock)

@end

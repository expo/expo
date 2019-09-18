//
//  ABI35_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI35_0_0AIRMapCalloutSubviewManager.h"
#import "ABI35_0_0AIRMapCalloutSubview.h"
#import <ReactABI35_0_0/ABI35_0_0RCTView.h>

@implementation ABI35_0_0AIRMapCalloutSubviewManager
ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI35_0_0AIRMapCalloutSubview *calloutSubview = [ABI35_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI35_0_0RCTBubblingEventBlock)

@end

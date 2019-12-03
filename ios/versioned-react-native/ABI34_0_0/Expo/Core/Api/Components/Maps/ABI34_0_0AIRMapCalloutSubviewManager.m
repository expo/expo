//
//  ABI34_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI34_0_0AIRMapCalloutSubviewManager.h"
#import "ABI34_0_0AIRMapCalloutSubview.h"
#import <ReactABI34_0_0/ABI34_0_0RCTView.h>

@implementation ABI34_0_0AIRMapCalloutSubviewManager
ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI34_0_0AIRMapCalloutSubview *calloutSubview = [ABI34_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI34_0_0RCTBubblingEventBlock)

@end

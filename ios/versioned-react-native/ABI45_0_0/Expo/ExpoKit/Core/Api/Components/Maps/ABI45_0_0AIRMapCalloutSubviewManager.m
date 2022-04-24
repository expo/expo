//
//  ABI45_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI45_0_0AIRMapCalloutSubviewManager.h"
#import "ABI45_0_0AIRMapCalloutSubview.h"
#import <ABI45_0_0React/ABI45_0_0RCTView.h>

@implementation ABI45_0_0AIRMapCalloutSubviewManager
ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0AIRMapCalloutSubview *calloutSubview = [ABI45_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI45_0_0RCTBubblingEventBlock)

@end

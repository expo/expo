//
//  ABI39_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI39_0_0AIRMapCalloutSubviewManager.h"
#import "ABI39_0_0AIRMapCalloutSubview.h"
#import <ABI39_0_0React/ABI39_0_0RCTView.h>

@implementation ABI39_0_0AIRMapCalloutSubviewManager
ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0AIRMapCalloutSubview *calloutSubview = [ABI39_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI39_0_0RCTBubblingEventBlock)

@end

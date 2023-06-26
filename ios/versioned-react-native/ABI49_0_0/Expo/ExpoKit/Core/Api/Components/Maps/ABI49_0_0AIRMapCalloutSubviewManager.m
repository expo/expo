//
//  ABI49_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI49_0_0AIRMapCalloutSubviewManager.h"
#import "ABI49_0_0AIRMapCalloutSubview.h"
#import <ABI49_0_0React/ABI49_0_0RCTView.h>

@implementation ABI49_0_0AIRMapCalloutSubviewManager
ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI49_0_0AIRMapCalloutSubview *calloutSubview = [ABI49_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI49_0_0RCTBubblingEventBlock)

@end

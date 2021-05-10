//
//  ABI41_0_0AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "ABI41_0_0AIRMapCalloutSubviewManager.h"
#import "ABI41_0_0AIRMapCalloutSubview.h"
#import <ABI41_0_0React/ABI41_0_0RCTView.h>

@implementation ABI41_0_0AIRMapCalloutSubviewManager
ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI41_0_0AIRMapCalloutSubview *calloutSubview = [ABI41_0_0AIRMapCalloutSubview new];
  return calloutSubview;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI41_0_0RCTBubblingEventBlock)

@end

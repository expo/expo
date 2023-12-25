//
//  AIRMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import "AIRMapCalloutSubviewManager.h"
#import "AIRMapCalloutSubview.h"
#import <React/RCTView.h>

@implementation AIRMapCalloutSubviewManager
RCT_EXPORT_MODULE()

- (UIView *)view
{
  AIRMapCalloutSubview *calloutSubview = [AIRMapCalloutSubview new];
  return calloutSubview;
}

RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

@end

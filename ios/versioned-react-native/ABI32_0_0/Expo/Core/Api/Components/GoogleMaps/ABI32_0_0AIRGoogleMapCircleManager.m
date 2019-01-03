//
//  ABI32_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI32_0_0AIRGoogleMapCircleManager.h"
#import "ABI32_0_0AIRGoogleMapCircle.h"
#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>
#import <ReactABI32_0_0/UIView+ReactABI32_0_0.h>

@interface ABI32_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI32_0_0AIRGoogleMapCircleManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI32_0_0AIRGoogleMapCircle *circle = [ABI32_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

//
//  ABI20_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI20_0_0AIRGoogleMapCircleManager.h"
#import "ABI20_0_0AIRGoogleMapCircle.h"
#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>

@interface ABI20_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI20_0_0AIRGoogleMapCircleManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI20_0_0AIRGoogleMapCircle *circle = [ABI20_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

//
//  ABI21_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI21_0_0AIRGoogleMapCircleManager.h"
#import "ABI21_0_0AIRGoogleMapCircle.h"
#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#import <ReactABI21_0_0/UIView+ReactABI21_0_0.h>

@interface ABI21_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI21_0_0AIRGoogleMapCircleManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI21_0_0AIRGoogleMapCircle *circle = [ABI21_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

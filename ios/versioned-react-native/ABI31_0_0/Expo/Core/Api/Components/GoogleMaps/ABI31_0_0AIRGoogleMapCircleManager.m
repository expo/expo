//
//  ABI31_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI31_0_0AIRGoogleMapCircleManager.h"
#import "ABI31_0_0AIRGoogleMapCircle.h"
#import <ReactABI31_0_0/ABI31_0_0RCTBridge.h>
#import <ReactABI31_0_0/UIView+ReactABI31_0_0.h>

@interface ABI31_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI31_0_0AIRGoogleMapCircleManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI31_0_0AIRGoogleMapCircle *circle = [ABI31_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

//
//  ABI18_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI18_0_0AIRGoogleMapCircleManager.h"
#import "ABI18_0_0AIRGoogleMapCircle.h"
#import <ReactABI18_0_0/ABI18_0_0RCTBridge.h>
#import <ReactABI18_0_0/UIView+ReactABI18_0_0.h>

@interface ABI18_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI18_0_0AIRGoogleMapCircleManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI18_0_0AIRGoogleMapCircle *circle = [ABI18_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

//
//  ABI16_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI16_0_0AIRGoogleMapCircleManager.h"
#import "ABI16_0_0AIRGoogleMapCircle.h"
#import <ReactABI16_0_0/ABI16_0_0RCTBridge.h>
#import <ReactABI16_0_0/UIView+ReactABI16_0_0.h>

@interface ABI16_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI16_0_0AIRGoogleMapCircleManager

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI16_0_0AIRGoogleMapCircle *circle = [ABI16_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

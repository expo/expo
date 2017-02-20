//
//  ABI14_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI14_0_0AIRGoogleMapCircleManager.h"
#import "ABI14_0_0AIRGoogleMapCircle.h"
#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import <ReactABI14_0_0/UIView+ReactABI14_0_0.h>

@interface ABI14_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI14_0_0AIRGoogleMapCircleManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI14_0_0AIRGoogleMapCircle *circle = [ABI14_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

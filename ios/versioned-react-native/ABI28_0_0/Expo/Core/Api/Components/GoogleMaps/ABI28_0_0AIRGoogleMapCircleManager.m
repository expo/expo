//
//  ABI28_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI28_0_0AIRGoogleMapCircleManager.h"
#import "ABI28_0_0AIRGoogleMapCircle.h"
#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>

@interface ABI28_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI28_0_0AIRGoogleMapCircleManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI28_0_0AIRGoogleMapCircle *circle = [ABI28_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

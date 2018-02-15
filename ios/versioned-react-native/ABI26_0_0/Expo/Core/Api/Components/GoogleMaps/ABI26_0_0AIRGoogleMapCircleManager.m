//
//  ABI26_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI26_0_0AIRGoogleMapCircleManager.h"
#import "ABI26_0_0AIRGoogleMapCircle.h"
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/UIView+ReactABI26_0_0.h>

@interface ABI26_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI26_0_0AIRGoogleMapCircleManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI26_0_0AIRGoogleMapCircle *circle = [ABI26_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

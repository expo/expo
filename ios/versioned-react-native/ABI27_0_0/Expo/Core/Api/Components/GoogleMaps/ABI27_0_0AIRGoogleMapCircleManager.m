//
//  ABI27_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI27_0_0AIRGoogleMapCircleManager.h"
#import "ABI27_0_0AIRGoogleMapCircle.h"
#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>

@interface ABI27_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI27_0_0AIRGoogleMapCircleManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI27_0_0AIRGoogleMapCircle *circle = [ABI27_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

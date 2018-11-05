//
//  ABI30_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI30_0_0AIRGoogleMapCircleManager.h"
#import "ABI30_0_0AIRGoogleMapCircle.h"
#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>

@interface ABI30_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI30_0_0AIRGoogleMapCircleManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI30_0_0AIRGoogleMapCircle *circle = [ABI30_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

//
//  ABI25_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI25_0_0AIRGoogleMapCircleManager.h"
#import "ABI25_0_0AIRGoogleMapCircle.h"
#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/UIView+ReactABI25_0_0.h>

@interface ABI25_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI25_0_0AIRGoogleMapCircleManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI25_0_0AIRGoogleMapCircle *circle = [ABI25_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

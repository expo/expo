//
//  ABI24_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI24_0_0AIRGoogleMapCircleManager.h"
#import "ABI24_0_0AIRGoogleMapCircle.h"
#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>

@interface ABI24_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI24_0_0AIRGoogleMapCircleManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI24_0_0AIRGoogleMapCircle *circle = [ABI24_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

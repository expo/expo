//
//  ABI17_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI17_0_0AIRGoogleMapCircleManager.h"
#import "ABI17_0_0AIRGoogleMapCircle.h"
#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/UIView+ReactABI17_0_0.h>

@interface ABI17_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI17_0_0AIRGoogleMapCircleManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI17_0_0AIRGoogleMapCircle *circle = [ABI17_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

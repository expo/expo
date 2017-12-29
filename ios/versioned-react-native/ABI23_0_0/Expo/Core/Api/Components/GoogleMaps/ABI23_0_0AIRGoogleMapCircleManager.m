//
//  ABI23_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI23_0_0AIRGoogleMapCircleManager.h"
#import "ABI23_0_0AIRGoogleMapCircle.h"
#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import <ReactABI23_0_0/UIView+ReactABI23_0_0.h>

@interface ABI23_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI23_0_0AIRGoogleMapCircleManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI23_0_0AIRGoogleMapCircle *circle = [ABI23_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

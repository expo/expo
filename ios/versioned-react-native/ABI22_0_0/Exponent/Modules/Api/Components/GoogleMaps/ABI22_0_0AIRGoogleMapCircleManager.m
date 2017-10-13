//
//  ABI22_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI22_0_0AIRGoogleMapCircleManager.h"
#import "ABI22_0_0AIRGoogleMapCircle.h"
#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#import <ReactABI22_0_0/UIView+ReactABI22_0_0.h>

@interface ABI22_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI22_0_0AIRGoogleMapCircleManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI22_0_0AIRGoogleMapCircle *circle = [ABI22_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

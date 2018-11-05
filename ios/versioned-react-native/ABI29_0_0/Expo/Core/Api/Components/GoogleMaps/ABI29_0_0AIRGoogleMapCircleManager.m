//
//  ABI29_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI29_0_0AIRGoogleMapCircleManager.h"
#import "ABI29_0_0AIRGoogleMapCircle.h"
#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>

@interface ABI29_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI29_0_0AIRGoogleMapCircleManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI29_0_0AIRGoogleMapCircle *circle = [ABI29_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

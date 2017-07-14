//
//  ABI19_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#import "ABI19_0_0AIRGoogleMapCircleManager.h"
#import "ABI19_0_0AIRGoogleMapCircle.h"
#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/UIView+ReactABI19_0_0.h>

@interface ABI19_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI19_0_0AIRGoogleMapCircleManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI19_0_0AIRGoogleMapCircle *circle = [ABI19_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

//
//  ABI35_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI35_0_0HAVE_GOOGLE_MAPS

#import "ABI35_0_0AIRGoogleMapCircleManager.h"
#import "ABI35_0_0AIRGoogleMapCircle.h"
#import <ReactABI35_0_0/ABI35_0_0RCTBridge.h>
#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>

@interface ABI35_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI35_0_0AIRGoogleMapCircleManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI35_0_0AIRGoogleMapCircle *circle = [ABI35_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

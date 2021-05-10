//
//  ABI40_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI40_0_0HAVE_GOOGLE_MAPS

#import "ABI40_0_0AIRGoogleMapCircleManager.h"
#import "ABI40_0_0AIRGoogleMapCircle.h"
#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0UIView+React.h>

@interface ABI40_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI40_0_0AIRGoogleMapCircleManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI40_0_0AIRGoogleMapCircle *circle = [ABI40_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

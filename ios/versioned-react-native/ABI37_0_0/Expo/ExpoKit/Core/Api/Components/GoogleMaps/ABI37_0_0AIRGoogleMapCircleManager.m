//
//  ABI37_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI37_0_0HAVE_GOOGLE_MAPS

#import "ABI37_0_0AIRGoogleMapCircleManager.h"
#import "ABI37_0_0AIRGoogleMapCircle.h"
#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>

@interface ABI37_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI37_0_0AIRGoogleMapCircleManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI37_0_0AIRGoogleMapCircle *circle = [ABI37_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

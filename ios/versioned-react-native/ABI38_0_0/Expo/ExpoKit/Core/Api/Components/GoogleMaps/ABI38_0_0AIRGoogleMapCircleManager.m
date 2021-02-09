//
//  ABI38_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI38_0_0HAVE_GOOGLE_MAPS

#import "ABI38_0_0AIRGoogleMapCircleManager.h"
#import "ABI38_0_0AIRGoogleMapCircle.h"
#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0UIView+React.h>

@interface ABI38_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI38_0_0AIRGoogleMapCircleManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI38_0_0AIRGoogleMapCircle *circle = [ABI38_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

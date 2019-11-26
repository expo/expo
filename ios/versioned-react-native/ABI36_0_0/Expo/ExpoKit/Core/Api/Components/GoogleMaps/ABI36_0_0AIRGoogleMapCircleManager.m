//
//  ABI36_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI36_0_0HAVE_GOOGLE_MAPS

#import "ABI36_0_0AIRGoogleMapCircleManager.h"
#import "ABI36_0_0AIRGoogleMapCircle.h"
#import <ABI36_0_0React/ABI36_0_0RCTBridge.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>

@interface ABI36_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI36_0_0AIRGoogleMapCircleManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0AIRGoogleMapCircle *circle = [ABI36_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

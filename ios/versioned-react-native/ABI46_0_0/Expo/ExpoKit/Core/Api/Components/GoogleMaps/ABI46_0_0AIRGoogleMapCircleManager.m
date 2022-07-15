//
//  ABI46_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI46_0_0HAVE_GOOGLE_MAPS

#import "ABI46_0_0AIRGoogleMapCircleManager.h"
#import "ABI46_0_0AIRGoogleMapCircle.h"
#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0UIView+React.h>

@interface ABI46_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI46_0_0AIRGoogleMapCircleManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI46_0_0AIRGoogleMapCircle *circle = [ABI46_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

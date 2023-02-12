//
//  ABI47_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI47_0_0HAVE_GOOGLE_MAPS

#import "ABI47_0_0AIRGoogleMapCircleManager.h"
#import "ABI47_0_0AIRGoogleMapCircle.h"
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>

@interface ABI47_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI47_0_0AIRGoogleMapCircleManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0AIRGoogleMapCircle *circle = [ABI47_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

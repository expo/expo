//
//  ABI45_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI45_0_0HAVE_GOOGLE_MAPS

#import "ABI45_0_0AIRGoogleMapCircleManager.h"
#import "ABI45_0_0AIRGoogleMapCircle.h"
#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>

@interface ABI45_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI45_0_0AIRGoogleMapCircleManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0AIRGoogleMapCircle *circle = [ABI45_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

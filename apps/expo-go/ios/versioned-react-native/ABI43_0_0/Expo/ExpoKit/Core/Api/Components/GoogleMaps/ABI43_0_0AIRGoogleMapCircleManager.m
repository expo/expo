//
//  ABI43_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI43_0_0HAVE_GOOGLE_MAPS

#import "ABI43_0_0AIRGoogleMapCircleManager.h"
#import "ABI43_0_0AIRGoogleMapCircle.h"
#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0UIView+React.h>

@interface ABI43_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI43_0_0AIRGoogleMapCircleManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0AIRGoogleMapCircle *circle = [ABI43_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

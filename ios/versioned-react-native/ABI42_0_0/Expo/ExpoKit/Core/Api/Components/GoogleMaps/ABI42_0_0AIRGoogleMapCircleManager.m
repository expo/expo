//
//  ABI42_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI42_0_0HAVE_GOOGLE_MAPS

#import "ABI42_0_0AIRGoogleMapCircleManager.h"
#import "ABI42_0_0AIRGoogleMapCircle.h"
#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>

@interface ABI42_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI42_0_0AIRGoogleMapCircleManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI42_0_0AIRGoogleMapCircle *circle = [ABI42_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

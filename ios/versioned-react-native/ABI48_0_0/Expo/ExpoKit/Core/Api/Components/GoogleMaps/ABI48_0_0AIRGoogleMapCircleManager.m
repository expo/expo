//
//  ABI48_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import "ABI48_0_0AIRGoogleMapCircleManager.h"
#import "ABI48_0_0AIRGoogleMapCircle.h"
#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>

@interface ABI48_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI48_0_0AIRGoogleMapCircleManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0AIRGoogleMapCircle *circle = [ABI48_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

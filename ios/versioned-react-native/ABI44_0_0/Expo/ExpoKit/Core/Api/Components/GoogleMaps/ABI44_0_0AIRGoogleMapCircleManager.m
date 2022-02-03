//
//  ABI44_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI44_0_0HAVE_GOOGLE_MAPS

#import "ABI44_0_0AIRGoogleMapCircleManager.h"
#import "ABI44_0_0AIRGoogleMapCircle.h"
#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>

@interface ABI44_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI44_0_0AIRGoogleMapCircleManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0AIRGoogleMapCircle *circle = [ABI44_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

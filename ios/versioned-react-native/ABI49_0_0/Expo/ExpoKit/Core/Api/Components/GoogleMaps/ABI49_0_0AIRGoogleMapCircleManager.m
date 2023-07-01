//
//  ABI49_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI49_0_0HAVE_GOOGLE_MAPS

#import "ABI49_0_0AIRGoogleMapCircleManager.h"
#import "ABI49_0_0AIRGoogleMapCircle.h"
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>

@interface ABI49_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI49_0_0AIRGoogleMapCircleManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI49_0_0AIRGoogleMapCircle *circle = [ABI49_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

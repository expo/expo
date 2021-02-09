//
//  ABI39_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI39_0_0HAVE_GOOGLE_MAPS

#import "ABI39_0_0AIRGoogleMapCircleManager.h"
#import "ABI39_0_0AIRGoogleMapCircle.h"
#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>
#import <ABI39_0_0React/ABI39_0_0UIView+React.h>

@interface ABI39_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI39_0_0AIRGoogleMapCircleManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0AIRGoogleMapCircle *circle = [ABI39_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

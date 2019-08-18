//
//  ABI33_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS

#import "ABI33_0_0AIRGoogleMapCircleManager.h"
#import "ABI33_0_0AIRGoogleMapCircle.h"
#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>

@interface ABI33_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI33_0_0AIRGoogleMapCircleManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0AIRGoogleMapCircle *circle = [ABI33_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

//
//  ABI34_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI34_0_0HAVE_GOOGLE_MAPS

#import "ABI34_0_0AIRGoogleMapCircleManager.h"
#import "ABI34_0_0AIRGoogleMapCircle.h"
#import <ReactABI34_0_0/ABI34_0_0RCTBridge.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>

@interface ABI34_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI34_0_0AIRGoogleMapCircleManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI34_0_0AIRGoogleMapCircle *circle = [ABI34_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

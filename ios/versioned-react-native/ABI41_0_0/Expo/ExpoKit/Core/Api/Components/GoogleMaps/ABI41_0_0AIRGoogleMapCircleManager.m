//
//  ABI41_0_0AIRGoogleMapCircleManager.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI41_0_0HAVE_GOOGLE_MAPS

#import "ABI41_0_0AIRGoogleMapCircleManager.h"
#import "ABI41_0_0AIRGoogleMapCircle.h"
#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0UIView+React.h>

@interface ABI41_0_0AIRGoogleMapCircleManager()

@end

@implementation ABI41_0_0AIRGoogleMapCircleManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI41_0_0AIRGoogleMapCircle *circle = [ABI41_0_0AIRGoogleMapCircle new];
  return circle;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(radius, double)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(center, centerCoordinate, CLLocationCoordinate2D)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

#endif

//
//  ABI40_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI40_0_0HAVE_GOOGLE_MAPS

#import "ABI40_0_0AIRGoogleMapPolylineManager.h"

#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>
#import <ABI40_0_0React/ABI40_0_0RCTConvert+CoreLocation.h>
#import <ABI40_0_0React/ABI40_0_0RCTEventDispatcher.h>
#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>
#import <ABI40_0_0React/ABI40_0_0UIView+React.h>
#import "ABI40_0_0RCTConvert+AirMap.h"
#import "ABI40_0_0AIRGoogleMapPolyline.h"

@interface ABI40_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI40_0_0AIRGoogleMapPolylineManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI40_0_0AIRGoogleMapPolyline *polyline = [ABI40_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI40_0_0AIRMapCoordinateArray)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI40_0_0RCTBubblingEventBlock)

@end

#endif

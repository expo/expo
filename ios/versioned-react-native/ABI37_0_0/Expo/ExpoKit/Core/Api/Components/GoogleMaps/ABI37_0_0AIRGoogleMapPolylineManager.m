//
//  ABI37_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI37_0_0HAVE_GOOGLE_MAPS

#import "ABI37_0_0AIRGoogleMapPolylineManager.h"

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert+CoreLocation.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventDispatcher.h>
#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>
#import "ABI37_0_0RCTConvert+AirMap.h"
#import "ABI37_0_0AIRGoogleMapPolyline.h"

@interface ABI37_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI37_0_0AIRGoogleMapPolylineManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI37_0_0AIRGoogleMapPolyline *polyline = [ABI37_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI37_0_0AIRMapCoordinateArray)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI37_0_0RCTBubblingEventBlock)

@end

#endif

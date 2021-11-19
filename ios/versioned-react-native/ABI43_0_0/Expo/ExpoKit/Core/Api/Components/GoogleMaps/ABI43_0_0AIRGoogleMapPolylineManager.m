//
//  ABI43_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI43_0_0HAVE_GOOGLE_MAPS

#import "ABI43_0_0AIRGoogleMapPolylineManager.h"

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert+CoreLocation.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventDispatcher.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>
#import <ABI43_0_0React/ABI43_0_0UIView+React.h>
#import "ABI43_0_0RCTConvert+AirMap.h"
#import "ABI43_0_0AIRGoogleMapPolyline.h"

@interface ABI43_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI43_0_0AIRGoogleMapPolylineManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0AIRGoogleMapPolyline *polyline = [ABI43_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI43_0_0AIRMapCoordinateArray)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI43_0_0RCTBubblingEventBlock)

@end

#endif

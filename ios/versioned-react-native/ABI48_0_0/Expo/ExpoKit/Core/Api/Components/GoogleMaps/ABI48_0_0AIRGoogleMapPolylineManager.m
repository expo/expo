//
//  ABI48_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import "ABI48_0_0AIRGoogleMapPolylineManager.h"

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert+CoreLocation.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventDispatcher.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>
#import "ABI48_0_0RCTConvert+AirMap.h"
#import "ABI48_0_0AIRGoogleMapPolyline.h"

@interface ABI48_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI48_0_0AIRGoogleMapPolylineManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0AIRGoogleMapPolyline *polyline = [ABI48_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI48_0_0AIRMapCoordinateArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI48_0_0RCTBubblingEventBlock)

@end

#endif

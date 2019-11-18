//
//  ABI36_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI36_0_0HAVE_GOOGLE_MAPS

#import "ABI36_0_0AIRGoogleMapPolylineManager.h"

#import <ABI36_0_0React/ABI36_0_0RCTBridge.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert+CoreLocation.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventDispatcher.h>
#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>
#import "ABI36_0_0RCTConvert+AirMap.h"
#import "ABI36_0_0AIRGoogleMapPolyline.h"

@interface ABI36_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI36_0_0AIRGoogleMapPolylineManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0AIRGoogleMapPolyline *polyline = [ABI36_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI36_0_0AIRMapCoordinateArray)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI36_0_0RCTBubblingEventBlock)

@end

#endif

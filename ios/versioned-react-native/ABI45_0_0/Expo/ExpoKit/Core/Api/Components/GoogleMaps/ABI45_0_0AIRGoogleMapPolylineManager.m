//
//  ABI45_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI45_0_0HAVE_GOOGLE_MAPS

#import "ABI45_0_0AIRGoogleMapPolylineManager.h"

#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>
#import <ABI45_0_0React/ABI45_0_0RCTConvert.h>
#import <ABI45_0_0React/ABI45_0_0RCTConvert+CoreLocation.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventDispatcher.h>
#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>
#import "ABI45_0_0RCTConvert+AirMap.h"
#import "ABI45_0_0AIRGoogleMapPolyline.h"

@interface ABI45_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI45_0_0AIRGoogleMapPolylineManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0AIRGoogleMapPolyline *polyline = [ABI45_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI45_0_0AIRMapCoordinateArray)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI45_0_0RCTBubblingEventBlock)

@end

#endif

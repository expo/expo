//
//  ABI47_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI47_0_0HAVE_GOOGLE_MAPS

#import "ABI47_0_0AIRGoogleMapPolylineManager.h"

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert+CoreLocation.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcher.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>
#import "ABI47_0_0RCTConvert+AirMap.h"
#import "ABI47_0_0AIRGoogleMapPolyline.h"

@interface ABI47_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI47_0_0AIRGoogleMapPolylineManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0AIRGoogleMapPolyline *polyline = [ABI47_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI47_0_0AIRMapCoordinateArray)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI47_0_0RCTBubblingEventBlock)

@end

#endif

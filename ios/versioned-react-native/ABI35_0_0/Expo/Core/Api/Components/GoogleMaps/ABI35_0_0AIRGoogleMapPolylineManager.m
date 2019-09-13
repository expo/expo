//
//  ABI35_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI35_0_0HAVE_GOOGLE_MAPS

#import "ABI35_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI35_0_0/ABI35_0_0RCTBridge.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert+CoreLocation.h>
#import <ReactABI35_0_0/ABI35_0_0RCTEventDispatcher.h>
#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>
#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>
#import "ABI35_0_0RCTConvert+AirMap.h"
#import "ABI35_0_0AIRGoogleMapPolyline.h"

@interface ABI35_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI35_0_0AIRGoogleMapPolylineManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI35_0_0AIRGoogleMapPolyline *polyline = [ABI35_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI35_0_0AIRMapCoordinateArray)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI35_0_0RCTBubblingEventBlock)

@end

#endif

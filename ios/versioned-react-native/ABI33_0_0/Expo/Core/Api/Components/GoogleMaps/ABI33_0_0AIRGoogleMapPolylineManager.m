//
//  ABI33_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS

#import "ABI33_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert+CoreLocation.h>
#import <ReactABI33_0_0/ABI33_0_0RCTEventDispatcher.h>
#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>
#import "ABI33_0_0RCTConvert+AirMap.h"
#import "ABI33_0_0AIRGoogleMapPolyline.h"

@interface ABI33_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI33_0_0AIRGoogleMapPolylineManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0AIRGoogleMapPolyline *polyline = [ABI33_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI33_0_0AIRMapCoordinateArray)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI33_0_0RCTBubblingEventBlock)

@end

#endif

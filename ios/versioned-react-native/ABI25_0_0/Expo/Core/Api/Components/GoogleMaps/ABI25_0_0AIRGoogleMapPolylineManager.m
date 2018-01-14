//
//  ABI25_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI25_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTConvert.h>
#import <ReactABI25_0_0/ABI25_0_0RCTConvert+CoreLocation.h>
#import <ReactABI25_0_0/ABI25_0_0RCTEventDispatcher.h>
#import <ReactABI25_0_0/ABI25_0_0RCTViewManager.h>
#import <ReactABI25_0_0/UIView+ReactABI25_0_0.h>
#import "ABI25_0_0RCTConvert+AirMap.h"
#import "ABI25_0_0AIRGoogleMapPolyline.h"

@interface ABI25_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI25_0_0AIRGoogleMapPolylineManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI25_0_0AIRGoogleMapPolyline *polyline = [ABI25_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI25_0_0AIRMapCoordinateArray)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

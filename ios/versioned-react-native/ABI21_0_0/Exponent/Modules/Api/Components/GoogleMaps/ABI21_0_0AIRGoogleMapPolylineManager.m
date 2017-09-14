//
//  ABI21_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI21_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#import <ReactABI21_0_0/ABI21_0_0RCTConvert.h>
#import <ReactABI21_0_0/ABI21_0_0RCTConvert+CoreLocation.h>
#import <ReactABI21_0_0/ABI21_0_0RCTEventDispatcher.h>
#import <ReactABI21_0_0/ABI21_0_0RCTViewManager.h>
#import <ReactABI21_0_0/UIView+ReactABI21_0_0.h>
#import "ABI21_0_0RCTConvert+AirMap.h"
#import "ABI21_0_0AIRGoogleMapPolyline.h"

@interface ABI21_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI21_0_0AIRGoogleMapPolylineManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI21_0_0AIRGoogleMapPolyline *polyline = [ABI21_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI21_0_0AIRMapCoordinateArray)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

//
//  ABI24_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI24_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert+CoreLocation.h>
#import <ReactABI24_0_0/ABI24_0_0RCTEventDispatcher.h>
#import <ReactABI24_0_0/ABI24_0_0RCTViewManager.h>
#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>
#import "ABI24_0_0RCTConvert+AirMap.h"
#import "ABI24_0_0AIRGoogleMapPolyline.h"

@interface ABI24_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI24_0_0AIRGoogleMapPolylineManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI24_0_0AIRGoogleMapPolyline *polyline = [ABI24_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI24_0_0AIRMapCoordinateArray)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

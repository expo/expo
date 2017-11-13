//
//  ABI23_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI23_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert+CoreLocation.h>
#import <ReactABI23_0_0/ABI23_0_0RCTEventDispatcher.h>
#import <ReactABI23_0_0/ABI23_0_0RCTViewManager.h>
#import <ReactABI23_0_0/UIView+ReactABI23_0_0.h>
#import "ABI23_0_0RCTConvert+AirMap.h"
#import "ABI23_0_0AIRGoogleMapPolyline.h"

@interface ABI23_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI23_0_0AIRGoogleMapPolylineManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI23_0_0AIRGoogleMapPolyline *polyline = [ABI23_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI23_0_0AIRMapCoordinateArray)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

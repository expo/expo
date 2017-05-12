//
//  ABI17_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI17_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/ABI17_0_0RCTConvert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTConvert+CoreLocation.h>
#import <ReactABI17_0_0/ABI17_0_0RCTEventDispatcher.h>
#import <ReactABI17_0_0/ABI17_0_0RCTViewManager.h>
#import <ReactABI17_0_0/UIView+ReactABI17_0_0.h>
#import "ABI17_0_0RCTConvert+AirMap.h"
#import "ABI17_0_0AIRGoogleMapPolyline.h"

@interface ABI17_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI17_0_0AIRGoogleMapPolylineManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI17_0_0AIRGoogleMapPolyline *polyline = [ABI17_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI17_0_0AIRMapCoordinateArray)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

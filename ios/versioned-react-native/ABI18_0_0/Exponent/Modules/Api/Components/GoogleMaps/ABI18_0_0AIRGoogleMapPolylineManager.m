//
//  ABI18_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI18_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI18_0_0/ABI18_0_0RCTBridge.h>
#import <ReactABI18_0_0/ABI18_0_0RCTConvert.h>
#import <ReactABI18_0_0/ABI18_0_0RCTConvert+CoreLocation.h>
#import <ReactABI18_0_0/ABI18_0_0RCTEventDispatcher.h>
#import <ReactABI18_0_0/ABI18_0_0RCTViewManager.h>
#import <ReactABI18_0_0/UIView+ReactABI18_0_0.h>
#import "ABI18_0_0RCTConvert+AirMap.h"
#import "ABI18_0_0AIRGoogleMapPolyline.h"

@interface ABI18_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI18_0_0AIRGoogleMapPolylineManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI18_0_0AIRGoogleMapPolyline *polyline = [ABI18_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI18_0_0AIRMapCoordinateArray)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

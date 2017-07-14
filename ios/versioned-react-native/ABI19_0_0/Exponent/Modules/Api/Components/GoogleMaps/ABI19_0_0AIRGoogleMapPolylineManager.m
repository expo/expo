//
//  ABI19_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI19_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert+CoreLocation.h>
#import <ReactABI19_0_0/ABI19_0_0RCTEventDispatcher.h>
#import <ReactABI19_0_0/ABI19_0_0RCTViewManager.h>
#import <ReactABI19_0_0/UIView+ReactABI19_0_0.h>
#import "ABI19_0_0RCTConvert+AirMap.h"
#import "ABI19_0_0AIRGoogleMapPolyline.h"

@interface ABI19_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI19_0_0AIRGoogleMapPolylineManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI19_0_0AIRGoogleMapPolyline *polyline = [ABI19_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI19_0_0AIRMapCoordinateArray)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

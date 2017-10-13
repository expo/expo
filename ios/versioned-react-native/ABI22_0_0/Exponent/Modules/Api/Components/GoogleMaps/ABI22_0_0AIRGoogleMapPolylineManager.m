//
//  ABI22_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI22_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert+CoreLocation.h>
#import <ReactABI22_0_0/ABI22_0_0RCTEventDispatcher.h>
#import <ReactABI22_0_0/ABI22_0_0RCTViewManager.h>
#import <ReactABI22_0_0/UIView+ReactABI22_0_0.h>
#import "ABI22_0_0RCTConvert+AirMap.h"
#import "ABI22_0_0AIRGoogleMapPolyline.h"

@interface ABI22_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI22_0_0AIRGoogleMapPolylineManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI22_0_0AIRGoogleMapPolyline *polyline = [ABI22_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI22_0_0AIRMapCoordinateArray)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

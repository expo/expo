//
//  ABI15_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI15_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI15_0_0/ABI15_0_0RCTBridge.h>
#import <ReactABI15_0_0/ABI15_0_0RCTConvert.h>
#import <ReactABI15_0_0/ABI15_0_0RCTConvert+CoreLocation.h>
#import <ReactABI15_0_0/ABI15_0_0RCTEventDispatcher.h>
#import <ReactABI15_0_0/ABI15_0_0RCTViewManager.h>
#import <ReactABI15_0_0/UIView+ReactABI15_0_0.h>
#import "ABI15_0_0RCTConvert+MoreMapKit.h"
#import "ABI15_0_0AIRGoogleMapPolyline.h"

@interface ABI15_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI15_0_0AIRGoogleMapPolylineManager

ABI15_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI15_0_0AIRGoogleMapPolyline *polyline = [ABI15_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI15_0_0AIRMapCoordinateArray)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

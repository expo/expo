//
//  ABI14_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI14_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert+CoreLocation.h>
#import <ReactABI14_0_0/ABI14_0_0RCTEventDispatcher.h>
#import <ReactABI14_0_0/ABI14_0_0RCTViewManager.h>
#import <ReactABI14_0_0/UIView+ReactABI14_0_0.h>
#import "ABI14_0_0RCTConvert+MoreMapKit.h"
#import "ABI14_0_0AIRGoogleMapPolyline.h"

@interface ABI14_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI14_0_0AIRGoogleMapPolylineManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI14_0_0AIRGoogleMapPolyline *polyline = [ABI14_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI14_0_0AIRMapCoordinateArray)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

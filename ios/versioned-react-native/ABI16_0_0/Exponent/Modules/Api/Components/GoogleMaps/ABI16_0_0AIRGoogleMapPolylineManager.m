//
//  ABI16_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI16_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI16_0_0/ABI16_0_0RCTBridge.h>
#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>
#import <ReactABI16_0_0/ABI16_0_0RCTConvert+CoreLocation.h>
#import <ReactABI16_0_0/ABI16_0_0RCTEventDispatcher.h>
#import <ReactABI16_0_0/ABI16_0_0RCTViewManager.h>
#import <ReactABI16_0_0/UIView+ReactABI16_0_0.h>
#import "ABI16_0_0RCTConvert+MoreMapKit.h"
#import "ABI16_0_0AIRGoogleMapPolyline.h"

@interface ABI16_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI16_0_0AIRGoogleMapPolylineManager

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI16_0_0AIRGoogleMapPolyline *polyline = [ABI16_0_0AIRGoogleMapPolyline new];
  return polyline;
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI16_0_0AIRMapCoordinateArray)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

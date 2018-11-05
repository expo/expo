//
//  ABI30_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI30_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert+CoreLocation.h>
#import <ReactABI30_0_0/ABI30_0_0RCTEventDispatcher.h>
#import <ReactABI30_0_0/ABI30_0_0RCTViewManager.h>
#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>
#import "ABI30_0_0RCTConvert+AirMap.h"
#import "ABI30_0_0AIRGoogleMapPolyline.h"

@interface ABI30_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI30_0_0AIRGoogleMapPolylineManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI30_0_0AIRGoogleMapPolyline *polyline = [ABI30_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI30_0_0AIRMapCoordinateArray)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI30_0_0RCTBubblingEventBlock)

@end

//
//  ABI32_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI32_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>
#import <ReactABI32_0_0/ABI32_0_0RCTConvert.h>
#import <ReactABI32_0_0/ABI32_0_0RCTConvert+CoreLocation.h>
#import <ReactABI32_0_0/ABI32_0_0RCTEventDispatcher.h>
#import <ReactABI32_0_0/ABI32_0_0RCTViewManager.h>
#import <ReactABI32_0_0/UIView+ReactABI32_0_0.h>
#import "ABI32_0_0RCTConvert+AirMap.h"
#import "ABI32_0_0AIRGoogleMapPolyline.h"

@interface ABI32_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI32_0_0AIRGoogleMapPolylineManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI32_0_0AIRGoogleMapPolyline *polyline = [ABI32_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI32_0_0AIRMapCoordinateArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI32_0_0RCTBubblingEventBlock)

@end

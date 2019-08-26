//
//  ABI31_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI31_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI31_0_0/ABI31_0_0RCTBridge.h>
#import <ReactABI31_0_0/ABI31_0_0RCTConvert.h>
#import <ReactABI31_0_0/ABI31_0_0RCTConvert+CoreLocation.h>
#import <ReactABI31_0_0/ABI31_0_0RCTEventDispatcher.h>
#import <ReactABI31_0_0/ABI31_0_0RCTViewManager.h>
#import <ReactABI31_0_0/UIView+ReactABI31_0_0.h>
#import "ABI31_0_0RCTConvert+AirMap.h"
#import "ABI31_0_0AIRGoogleMapPolyline.h"

@interface ABI31_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI31_0_0AIRGoogleMapPolylineManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI31_0_0AIRGoogleMapPolyline *polyline = [ABI31_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI31_0_0AIRMapCoordinateArray)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI31_0_0RCTBubblingEventBlock)

@end

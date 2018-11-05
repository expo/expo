//
//  ABI26_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI26_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert+CoreLocation.h>
#import <ReactABI26_0_0/ABI26_0_0RCTEventDispatcher.h>
#import <ReactABI26_0_0/ABI26_0_0RCTViewManager.h>
#import <ReactABI26_0_0/UIView+ReactABI26_0_0.h>
#import "ABI26_0_0RCTConvert+AirMap.h"
#import "ABI26_0_0AIRGoogleMapPolyline.h"

@interface ABI26_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI26_0_0AIRGoogleMapPolylineManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI26_0_0AIRGoogleMapPolyline *polyline = [ABI26_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI26_0_0AIRMapCoordinateArray)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI26_0_0RCTBubblingEventBlock)

@end

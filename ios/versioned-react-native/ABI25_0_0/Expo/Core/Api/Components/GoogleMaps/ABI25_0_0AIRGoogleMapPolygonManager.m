//
//  ABI25_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "ABI25_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTConvert.h>
#import <ReactABI25_0_0/ABI25_0_0RCTConvert+CoreLocation.h>
#import <ReactABI25_0_0/ABI25_0_0RCTEventDispatcher.h>
#import <ReactABI25_0_0/ABI25_0_0RCTViewManager.h>
#import <ReactABI25_0_0/UIView+ReactABI25_0_0.h>
#import "ABI25_0_0RCTConvert+AirMap.h"
#import "ABI25_0_0AIRGoogleMapPolygon.h"

@interface ABI25_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI25_0_0AIRGoogleMapPolygonManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI25_0_0AIRGoogleMapPolygon *polygon = [ABI25_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI25_0_0AIRMapCoordinateArray)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI25_0_0AIRMapCoordinateArrayArray)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI25_0_0RCTBubblingEventBlock)

@end

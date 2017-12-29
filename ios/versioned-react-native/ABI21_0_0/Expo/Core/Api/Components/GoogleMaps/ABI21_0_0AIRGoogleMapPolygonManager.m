//
//  ABI21_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "ABI21_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#import <ReactABI21_0_0/ABI21_0_0RCTConvert.h>
#import <ReactABI21_0_0/ABI21_0_0RCTConvert+CoreLocation.h>
#import <ReactABI21_0_0/ABI21_0_0RCTEventDispatcher.h>
#import <ReactABI21_0_0/ABI21_0_0RCTViewManager.h>
#import <ReactABI21_0_0/UIView+ReactABI21_0_0.h>
#import "ABI21_0_0RCTConvert+AirMap.h"
#import "ABI21_0_0AIRGoogleMapPolygon.h"

@interface ABI21_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI21_0_0AIRGoogleMapPolygonManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI21_0_0AIRGoogleMapPolygon *polygon = [ABI21_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI21_0_0AIRMapCoordinateArray)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI21_0_0AIRMapCoordinateArrayArray)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI21_0_0RCTBubblingEventBlock)

@end

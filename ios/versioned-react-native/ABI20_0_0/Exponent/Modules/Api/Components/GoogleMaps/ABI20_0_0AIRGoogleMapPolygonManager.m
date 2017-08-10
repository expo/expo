//
//  ABI20_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "ABI20_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert+CoreLocation.h>
#import <ReactABI20_0_0/ABI20_0_0RCTEventDispatcher.h>
#import <ReactABI20_0_0/ABI20_0_0RCTViewManager.h>
#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>
#import "ABI20_0_0RCTConvert+AirMap.h"
#import "ABI20_0_0AIRGoogleMapPolygon.h"

@interface ABI20_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI20_0_0AIRGoogleMapPolygonManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI20_0_0AIRGoogleMapPolygon *polygon = [ABI20_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI20_0_0AIRMapCoordinateArray)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI20_0_0AIRMapCoordinateArrayArray)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI20_0_0RCTBubblingEventBlock)

@end

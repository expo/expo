//
//  ABI28_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "ABI28_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert+CoreLocation.h>
#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>
#import <ReactABI28_0_0/ABI28_0_0RCTViewManager.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>
#import "ABI28_0_0RCTConvert+AirMap.h"
#import "ABI28_0_0AIRGoogleMapPolygon.h"

@interface ABI28_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI28_0_0AIRGoogleMapPolygonManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI28_0_0AIRGoogleMapPolygon *polygon = [ABI28_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI28_0_0AIRMapCoordinateArray)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI28_0_0AIRMapCoordinateArrayArray)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI28_0_0RCTBubblingEventBlock)

@end

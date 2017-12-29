//
//  ABI23_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "ABI23_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert+CoreLocation.h>
#import <ReactABI23_0_0/ABI23_0_0RCTEventDispatcher.h>
#import <ReactABI23_0_0/ABI23_0_0RCTViewManager.h>
#import <ReactABI23_0_0/UIView+ReactABI23_0_0.h>
#import "ABI23_0_0RCTConvert+AirMap.h"
#import "ABI23_0_0AIRGoogleMapPolygon.h"

@interface ABI23_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI23_0_0AIRGoogleMapPolygonManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI23_0_0AIRGoogleMapPolygon *polygon = [ABI23_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI23_0_0AIRMapCoordinateArray)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI23_0_0AIRMapCoordinateArrayArray)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI23_0_0RCTBubblingEventBlock)

@end

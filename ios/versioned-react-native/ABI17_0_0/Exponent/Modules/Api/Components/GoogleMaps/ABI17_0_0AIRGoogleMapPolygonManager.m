//
//  ABI17_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "ABI17_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/ABI17_0_0RCTConvert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTConvert+CoreLocation.h>
#import <ReactABI17_0_0/ABI17_0_0RCTEventDispatcher.h>
#import <ReactABI17_0_0/ABI17_0_0RCTViewManager.h>
#import <ReactABI17_0_0/UIView+ReactABI17_0_0.h>
#import "ABI17_0_0RCTConvert+AirMap.h"
#import "ABI17_0_0AIRGoogleMapPolygon.h"

@interface ABI17_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI17_0_0AIRGoogleMapPolygonManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI17_0_0AIRGoogleMapPolygon *polygon = [ABI17_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI17_0_0AIRMapCoordinateArray)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI17_0_0AIRMapCoordinateArrayArray)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI17_0_0RCTBubblingEventBlock)

@end

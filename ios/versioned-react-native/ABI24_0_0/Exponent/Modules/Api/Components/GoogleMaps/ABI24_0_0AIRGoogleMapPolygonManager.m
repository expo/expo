//
//  ABI24_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "ABI24_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert+CoreLocation.h>
#import <ReactABI24_0_0/ABI24_0_0RCTEventDispatcher.h>
#import <ReactABI24_0_0/ABI24_0_0RCTViewManager.h>
#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>
#import "ABI24_0_0RCTConvert+AirMap.h"
#import "ABI24_0_0AIRGoogleMapPolygon.h"

@interface ABI24_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI24_0_0AIRGoogleMapPolygonManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI24_0_0AIRGoogleMapPolygon *polygon = [ABI24_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI24_0_0AIRMapCoordinateArray)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI24_0_0AIRMapCoordinateArrayArray)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI24_0_0RCTBubblingEventBlock)

@end

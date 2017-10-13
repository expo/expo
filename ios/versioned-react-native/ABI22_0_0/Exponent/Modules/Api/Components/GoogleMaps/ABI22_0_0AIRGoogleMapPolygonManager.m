//
//  ABI22_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "ABI22_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert+CoreLocation.h>
#import <ReactABI22_0_0/ABI22_0_0RCTEventDispatcher.h>
#import <ReactABI22_0_0/ABI22_0_0RCTViewManager.h>
#import <ReactABI22_0_0/UIView+ReactABI22_0_0.h>
#import "ABI22_0_0RCTConvert+AirMap.h"
#import "ABI22_0_0AIRGoogleMapPolygon.h"

@interface ABI22_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI22_0_0AIRGoogleMapPolygonManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI22_0_0AIRGoogleMapPolygon *polygon = [ABI22_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI22_0_0AIRMapCoordinateArray)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI22_0_0AIRMapCoordinateArrayArray)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI22_0_0RCTBubblingEventBlock)

@end

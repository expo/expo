//
//  ABI32_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI32_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>
#import <ReactABI32_0_0/ABI32_0_0RCTConvert.h>
#import <ReactABI32_0_0/ABI32_0_0RCTConvert+CoreLocation.h>
#import <ReactABI32_0_0/ABI32_0_0RCTEventDispatcher.h>
#import <ReactABI32_0_0/ABI32_0_0RCTViewManager.h>
#import <ReactABI32_0_0/UIView+ReactABI32_0_0.h>
#import "ABI32_0_0RCTConvert+AirMap.h"
#import "ABI32_0_0AIRGoogleMapPolygon.h"

@interface ABI32_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI32_0_0AIRGoogleMapPolygonManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI32_0_0AIRGoogleMapPolygon *polygon = [ABI32_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI32_0_0AIRMapCoordinateArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI32_0_0AIRMapCoordinateArrayArray)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI32_0_0RCTBubblingEventBlock)

@end

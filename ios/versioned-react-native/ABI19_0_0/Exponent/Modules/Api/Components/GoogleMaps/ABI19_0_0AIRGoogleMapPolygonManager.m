//
//  ABI19_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "ABI19_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert+CoreLocation.h>
#import <ReactABI19_0_0/ABI19_0_0RCTEventDispatcher.h>
#import <ReactABI19_0_0/ABI19_0_0RCTViewManager.h>
#import <ReactABI19_0_0/UIView+ReactABI19_0_0.h>
#import "ABI19_0_0RCTConvert+AirMap.h"
#import "ABI19_0_0AIRGoogleMapPolygon.h"

@interface ABI19_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI19_0_0AIRGoogleMapPolygonManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI19_0_0AIRGoogleMapPolygon *polygon = [ABI19_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI19_0_0AIRMapCoordinateArray)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI19_0_0AIRMapCoordinateArrayArray)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI19_0_0RCTBubblingEventBlock)

@end

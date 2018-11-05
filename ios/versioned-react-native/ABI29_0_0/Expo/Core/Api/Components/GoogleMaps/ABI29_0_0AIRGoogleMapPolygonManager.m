//
//  ABI29_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "ABI29_0_0AIRGoogleMapPolygonManager.h"

#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert+CoreLocation.h>
#import <ReactABI29_0_0/ABI29_0_0RCTEventDispatcher.h>
#import <ReactABI29_0_0/ABI29_0_0RCTViewManager.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>
#import "ABI29_0_0RCTConvert+AirMap.h"
#import "ABI29_0_0AIRGoogleMapPolygon.h"

@interface ABI29_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI29_0_0AIRGoogleMapPolygonManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI29_0_0AIRGoogleMapPolygon *polygon = [ABI29_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI29_0_0AIRMapCoordinateArray)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI29_0_0AIRMapCoordinateArrayArray)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI29_0_0RCTBubblingEventBlock)

@end

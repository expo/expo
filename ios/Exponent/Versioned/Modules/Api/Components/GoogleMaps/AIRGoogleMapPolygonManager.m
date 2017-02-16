//
//  AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//
#import "AIRGoogleMapPolygonManager.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTConvert+CoreLocation.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTViewManager.h>
#import <React/UIView+React.h>
#import "RCTConvert+MoreMapKit.h"
#import "AIRGoogleMapPolygon.h"

@interface AIRGoogleMapPolygonManager()

@end

@implementation AIRGoogleMapPolygonManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  AIRGoogleMapPolygon *polygon = [AIRGoogleMapPolygon new];
  return polygon;
}

RCT_EXPORT_VIEW_PROPERTY(coordinates, AIRMapCoordinateArray)
RCT_EXPORT_VIEW_PROPERTY(holes, AIRMapCoordinateArrayArray)
RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end

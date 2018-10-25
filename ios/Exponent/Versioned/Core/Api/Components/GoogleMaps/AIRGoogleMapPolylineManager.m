//
//  AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "AIRGoogleMapPolylineManager.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTConvert+CoreLocation.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTViewManager.h>
#import <React/UIView+React.h>
#import "RCTConvert+AirMap.h"
#import "AIRGoogleMapPolyline.h"

@interface AIRGoogleMapPolylineManager()

@end

@implementation AIRGoogleMapPolylineManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  AIRGoogleMapPolyline *polyline = [AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

RCT_EXPORT_VIEW_PROPERTY(coordinates, AIRMapCoordinateArray)
RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

@end

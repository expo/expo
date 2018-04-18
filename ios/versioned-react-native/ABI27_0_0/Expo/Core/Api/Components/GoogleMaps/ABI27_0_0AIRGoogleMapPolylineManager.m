//
//  ABI27_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI27_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/ABI27_0_0RCTConvert.h>
#import <ReactABI27_0_0/ABI27_0_0RCTConvert+CoreLocation.h>
#import <ReactABI27_0_0/ABI27_0_0RCTEventDispatcher.h>
#import <ReactABI27_0_0/ABI27_0_0RCTViewManager.h>
#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>
#import "ABI27_0_0RCTConvert+AirMap.h"
#import "ABI27_0_0AIRGoogleMapPolyline.h"

@interface ABI27_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI27_0_0AIRGoogleMapPolylineManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI27_0_0AIRGoogleMapPolyline *polyline = [ABI27_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI27_0_0AIRMapCoordinateArray)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI27_0_0RCTBubblingEventBlock)

@end

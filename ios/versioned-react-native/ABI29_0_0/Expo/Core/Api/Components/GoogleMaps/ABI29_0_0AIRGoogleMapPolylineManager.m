//
//  ABI29_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI29_0_0AIRGoogleMapPolylineManager.h"

#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert+CoreLocation.h>
#import <ReactABI29_0_0/ABI29_0_0RCTEventDispatcher.h>
#import <ReactABI29_0_0/ABI29_0_0RCTViewManager.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>
#import "ABI29_0_0RCTConvert+AirMap.h"
#import "ABI29_0_0AIRGoogleMapPolyline.h"

@interface ABI29_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI29_0_0AIRGoogleMapPolylineManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI29_0_0AIRGoogleMapPolyline *polyline = [ABI29_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI29_0_0AIRMapCoordinateArray)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI29_0_0RCTBubblingEventBlock)

@end

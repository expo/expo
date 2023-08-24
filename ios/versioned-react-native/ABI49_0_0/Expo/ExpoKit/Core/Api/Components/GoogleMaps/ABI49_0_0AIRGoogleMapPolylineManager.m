//
//  ABI49_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI49_0_0HAVE_GOOGLE_MAPS

#import "ABI49_0_0AIRGoogleMapPolylineManager.h"

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert+CoreLocation.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>
#import "ABI49_0_0RCTConvert+AirMap.h"
#import "ABI49_0_0AIRGoogleMapPolyline.h"

@interface ABI49_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI49_0_0AIRGoogleMapPolylineManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI49_0_0AIRGoogleMapPolyline *polyline = [ABI49_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI49_0_0AIRMapCoordinateArray)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI49_0_0RCTBubblingEventBlock)

@end

#endif
